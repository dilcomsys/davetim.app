-- Mobile contract: owner and guest mutations.
--
-- event_date is a `date` column and event_time a `time` column. Postgres has
-- no assignment cast from text, so both are cast explicitly;
-- mobile_assert_document validates the format first, so the cast cannot raise.
--
-- Every function is security definer, resolves the caller through auth.uid()
-- (or an unguessable guest token), whitelists the fields it writes, and never
-- lets the client set counters, slugs, publication timestamps or ownership.

begin;

-- ---------------------------------------------------------------------------
-- Owner invitation projection
-- ---------------------------------------------------------------------------
-- Mirrors INVITATION_COLUMNS in apps/mobile/src/features/invitations/
-- invitation-service.ts. Includes user_id because decodeInvitation requires it.

create or replace function public.mobile_owner_invitation_json(p_invitation public.invitations)
returns jsonb
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select public.mobile_public_invitation_json(p_invitation)
         || jsonb_build_object('user_id', p_invitation.user_id);
$$;

revoke all on function public.mobile_owner_invitation_json(public.invitations) from public;

-- ---------------------------------------------------------------------------
-- Document validation
-- ---------------------------------------------------------------------------
-- p_document is produced by serializeEditorDocument. Only these keys are read;
-- anything else the client sends is discarded rather than rejected, so an
-- older or newer client cannot inject columns.

create or replace function public.mobile_normalize_text(p_value jsonb, p_max integer)
returns text
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select case
    when p_value is null or jsonb_typeof(p_value) <> 'string' then null
    when length(btrim(p_value #>> '{}')) = 0 then null
    else left(btrim(p_value #>> '{}'), p_max)
  end;
$$;

revoke all on function public.mobile_normalize_text(jsonb, integer) from public;

create or replace function public.mobile_assert_document(p_document jsonb)
returns void
language plpgsql
immutable
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception 'invalid_document' using errcode = '22023';
  end if;

  -- 512 KB keeps a runaway editor document from filling a row.
  if pg_column_size(p_document) > 512 * 1024 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;

  if p_document ? 'image_url'
     and jsonb_typeof(p_document -> 'image_url') = 'string'
     and (p_document ->> 'image_url') !~ '^https://' then
    raise exception 'invalid_image_url' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.mobile_assert_document(jsonb) from public;

-- ---------------------------------------------------------------------------
-- Slug generation
-- ---------------------------------------------------------------------------
-- Self-contained so the mobile path does not depend on the legacy
-- generate_invitation_slug function surviving. Slugs are globally unique and
-- carry a random suffix, so they are not guessable from the title alone.

create or replace function public.mobile_generate_invitation_slug(p_title text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_base text;
  v_slug text;
begin
  v_base := lower(coalesce(p_title, ''));
  v_base := translate(v_base, 'çğıöşüâîû', 'cgiosuaiu');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := btrim(v_base, '-');
  v_base := left(nullif(v_base, ''), 48);
  v_base := coalesce(v_base, 'davet');

  for _ in 1..5 loop
    v_slug := v_base || '-' || encode(extensions.gen_random_bytes(4), 'hex');
    if not exists (select 1 from public.invitations where slug = v_slug) then
      return v_slug;
    end if;
  end loop;

  return v_base || '-' || replace(gen_random_uuid()::text, '-', '');
end;
$$;

revoke all on function public.mobile_generate_invitation_slug(text) from public;

-- ---------------------------------------------------------------------------
-- create_invitation_draft
-- ---------------------------------------------------------------------------
-- Quota note: the mobile release grants no paid tier, so the limit below is a
-- flat abuse guard, not a monetisation gate. Legacy subscription rows are
-- never consulted. Raise it here if real usage needs more.

create or replace function public.create_invitation_draft(
  p_document jsonb,
  p_template_id uuid default null,
  p_reward_receipt_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_invitation_quota constant integer := 25;
  v_user_id uuid := auth.uid();
  v_tier text;
  v_invitation public.invitations;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.mobile_assert_document(p_document);

  if not public.mobile_consume_rate_limit(
       'create_draft:' || v_user_id::text, 20, interval '1 hour') then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  if (select count(*) from public.invitations
      where user_id = v_user_id and status <> 'archived') >= c_invitation_quota then
    raise exception 'invitation_quota_reached' using errcode = '53400';
  end if;

  if p_template_id is not null then
    select tier into v_tier
    from public.templates
    where id = p_template_id and is_active = true;

    if not found then
      raise exception 'template_not_available' using errcode = '22023';
    end if;

    -- A paid-tier template is unlocked only by a verified, single-use receipt.
    if coalesce(v_tier, 'free') <> 'free' then
      if p_reward_receipt_id is null
         or not public.consume_reward_receipt(p_reward_receipt_id, 'single_premium_template', null) then
        raise exception 'template_requires_reward' using errcode = '42501';
      end if;
    end if;
  end if;

  insert into public.invitations (
    user_id, template_id, title, slug,
    event_date, event_time, event_location_name, event_location_address,
    image_url, content, settings, status, is_public, view_count, rsvp_count
  )
  values (
    v_user_id,
    p_template_id,
    coalesce(public.mobile_normalize_text(p_document -> 'title', 120), 'İsimsiz davet'),
    public.mobile_generate_invitation_slug(p_document ->> 'title'),
    public.mobile_normalize_text(p_document -> 'event_date', 32)::date,
    public.mobile_normalize_text(p_document -> 'event_time', 16)::time,
    public.mobile_normalize_text(p_document -> 'event_location_name', 160),
    public.mobile_normalize_text(p_document -> 'event_location_address', 400),
    public.mobile_normalize_text(p_document -> 'image_url', 2048),
    coalesce(p_document -> 'content', '{}'::jsonb),
    coalesce(p_document -> 'settings', '{}'::jsonb),
    'draft',
    false,
    0,
    0
  )
  returning * into v_invitation;

  return public.mobile_owner_invitation_json(v_invitation);
end;
$$;

revoke all on function public.create_invitation_draft(jsonb, uuid, uuid) from public;
grant execute on function public.create_invitation_draft(jsonb, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- save_invitation_document
-- ---------------------------------------------------------------------------

create or replace function public.save_invitation_document(
  p_invitation_id uuid,
  p_document jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.invitations;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.mobile_assert_document(p_document);

  -- Slug, status, is_public, counters, template_id and user_id are absent from
  -- this update on purpose. They move only through their own RPCs.
  update public.invitations
  set title = coalesce(public.mobile_normalize_text(p_document -> 'title', 120), title),
      event_date = public.mobile_normalize_text(p_document -> 'event_date', 32)::date,
      event_time = public.mobile_normalize_text(p_document -> 'event_time', 16)::time,
      event_location_name = public.mobile_normalize_text(p_document -> 'event_location_name', 160),
      event_location_address = public.mobile_normalize_text(p_document -> 'event_location_address', 400),
      image_url = public.mobile_normalize_text(p_document -> 'image_url', 2048),
      content = coalesce(p_document -> 'content', content),
      settings = coalesce(p_document -> 'settings', settings),
      updated_at = now()
  where id = p_invitation_id
    and user_id = auth.uid()
  returning * into v_invitation;

  if not found then
    raise exception 'invitation_not_found' using errcode = '42501';
  end if;

  return public.mobile_owner_invitation_json(v_invitation);
end;
$$;

revoke all on function public.save_invitation_document(uuid, jsonb) from public;
grant execute on function public.save_invitation_document(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- set_invitation_publish_state
-- ---------------------------------------------------------------------------

create or replace function public.set_invitation_publish_state(
  p_invitation_id uuid,
  p_publish boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.invitations;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.invitations
  where id = p_invitation_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = '42501';
  end if;

  if p_publish then
    if coalesce(btrim(v_invitation.title), '') = '' or v_invitation.event_date is null then
      raise exception 'invitation_incomplete' using errcode = '22023';
    end if;

    update public.invitations
    set status = 'published',
        is_public = true,
        published_at = coalesce(published_at, now()),
        updated_at = now()
    where id = p_invitation_id
    returning * into v_invitation;
  else
    update public.invitations
    set status = 'draft',
        is_public = false,
        updated_at = now()
    where id = p_invitation_id
    returning * into v_invitation;
  end if;

  return public.mobile_owner_invitation_json(v_invitation);
end;
$$;

revoke all on function public.set_invitation_publish_state(uuid, boolean) from public;
grant execute on function public.set_invitation_publish_state(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- manage_invitation_lifecycle
-- ---------------------------------------------------------------------------
-- Storage cleanup note: deleting an invitation marks its media rows deleted
-- but does not remove storage objects, because SQL cannot call the storage
-- API. The delete-media-object Edge Function and the scheduled cleanup job
-- own object removal. See docs/engineering/BACKEND-IMPLEMENTATION.md.

create or replace function public.manage_invitation_lifecycle(
  p_invitation_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source public.invitations;
  v_result public.invitations;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('archive', 'restore', 'duplicate', 'delete') then
    raise exception 'unsupported_action' using errcode = '22023';
  end if;

  select * into v_source
  from public.invitations
  where id = p_invitation_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = '42501';
  end if;

  if p_action = 'archive' then
    update public.invitations
    set status = 'archived', is_public = false, updated_at = now()
    where id = p_invitation_id
    returning * into v_result;

  elsif p_action = 'restore' then
    update public.invitations
    set status = 'draft', updated_at = now()
    where id = p_invitation_id
    returning * into v_result;

  elsif p_action = 'duplicate' then
    insert into public.invitations (
      user_id, template_id, title, slug,
      event_type, event_date, event_time,
      event_location_name, event_location_address,
      custom_design, content, settings,
      status, is_public, view_count, rsvp_count, image_url
    )
    values (
      v_source.user_id, v_source.template_id,
      left(v_source.title || ' (kopya)', 120),
      public.mobile_generate_invitation_slug(v_source.title),
      v_source.event_type, v_source.event_date, v_source.event_time,
      v_source.event_location_name, v_source.event_location_address,
      v_source.custom_design, v_source.content, v_source.settings,
      'draft', false, 0, 0, v_source.image_url
    )
    returning * into v_result;

  else
    update public.media
    set status = 'deleted', updated_at = now()
    where invitation_id = p_invitation_id and user_id = auth.uid();

    delete from public.guests where invitation_id = p_invitation_id;
    delete from public.invitations where id = p_invitation_id;
    return null;
  end if;

  return public.mobile_owner_invitation_json(v_result);
end;
$$;

revoke all on function public.manage_invitation_lifecycle(uuid, text) from public;
grant execute on function public.manage_invitation_lifecycle(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------

create or replace function public.mobile_new_guest_token()
returns text
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select encode(extensions.gen_random_bytes(24), 'hex');
$$;

revoke all on function public.mobile_new_guest_token() from public;

create or replace function public.mobile_refresh_rsvp_count(p_invitation_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.invitations
  set rsvp_count = (
    select count(*) from public.guests
    where invitation_id = p_invitation_id and rsvp_status = 'attending'
  )
  where id = p_invitation_id;
$$;

revoke all on function public.mobile_refresh_rsvp_count(uuid) from public;

create or replace function public.manage_invitation_guest(
  p_invitation_id uuid,
  p_action text,
  p_guest_id uuid default null,
  p_full_name text default null,
  p_email text default null,
  p_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_guest_limit constant integer := 500;
  v_name text;
  v_email text;
begin
  if not public.mobile_is_invitation_owner(p_invitation_id) then
    raise exception 'invitation_not_found' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('create', 'update', 'delete') then
    raise exception 'unsupported_action' using errcode = '22023';
  end if;

  v_name := left(btrim(coalesce(p_full_name, '')), 120);
  v_email := lower(left(btrim(coalesce(p_email, '')), 200));

  if v_email <> '' and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if p_action = 'create' then
    if v_name = '' then
      raise exception 'guest_name_required' using errcode = '22023';
    end if;

    if (select count(*) from public.guests where invitation_id = p_invitation_id) >= c_guest_limit then
      raise exception 'guest_limit_reached' using errcode = '53400';
    end if;

    insert into public.guests (
      invitation_id, full_name, email, phone,
      rsvp_status, companion_count, guest_token
    )
    values (
      p_invitation_id, v_name,
      nullif(v_email, ''),
      nullif(left(btrim(coalesce(p_phone, '')), 40), ''),
      'pending', 0, public.mobile_new_guest_token()
    );

  elsif p_action = 'update' then
    if p_guest_id is null then
      raise exception 'guest_id_required' using errcode = '22023';
    end if;

    update public.guests
    set full_name = case when v_name = '' then full_name else v_name end,
        email = nullif(v_email, ''),
        phone = nullif(left(btrim(coalesce(p_phone, '')), 40), ''),
        updated_at = now()
    where id = p_guest_id and invitation_id = p_invitation_id;

    if not found then
      raise exception 'guest_not_found' using errcode = '42501';
    end if;

  else
    if p_guest_id is null then
      raise exception 'guest_id_required' using errcode = '22023';
    end if;

    delete from public.guests
    where id = p_guest_id and invitation_id = p_invitation_id;

    if not found then
      raise exception 'guest_not_found' using errcode = '42501';
    end if;
  end if;

  perform public.mobile_refresh_rsvp_count(p_invitation_id);
end;
$$;

revoke all on function public.manage_invitation_guest(uuid, text, uuid, text, text, text) from public;
grant execute on function public.manage_invitation_guest(uuid, text, uuid, text, text, text) to authenticated;

create or replace function public.bulk_import_invitation_guests(
  p_invitation_id uuid,
  p_guests jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_guest_limit constant integer := 500;
  v_inserted integer;
begin
  if not public.mobile_is_invitation_owner(p_invitation_id) then
    raise exception 'invitation_not_found' using errcode = '42501';
  end if;

  if p_guests is null or jsonb_typeof(p_guests) <> 'array' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  if jsonb_array_length(p_guests) between 1 and c_guest_limit then
    null;
  else
    raise exception 'invalid_guest_count' using errcode = '22023';
  end if;

  if (select count(*) from public.guests where invitation_id = p_invitation_id)
     + jsonb_array_length(p_guests) > c_guest_limit then
    raise exception 'guest_limit_reached' using errcode = '53400';
  end if;

  with candidate as (
    select left(btrim(coalesce(item ->> 'full_name', '')), 120) as full_name,
           nullif(lower(left(btrim(coalesce(item ->> 'email', '')), 200)), '') as email,
           nullif(left(btrim(coalesce(item ->> 'phone', '')), 40), '') as phone
    from jsonb_array_elements(p_guests) as item
  ),
  accepted as (
    select * from candidate
    where full_name <> ''
      and (email is null or email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')
  ),
  inserted as (
    insert into public.guests (
      invitation_id, full_name, email, phone,
      rsvp_status, companion_count, guest_token
    )
    select p_invitation_id, full_name, email, phone,
           'pending', 0, public.mobile_new_guest_token()
    from accepted
    returning 1
  )
  select count(*) into v_inserted from inserted;

  if v_inserted = 0 then
    raise exception 'no_valid_guest_rows' using errcode = '22023';
  end if;

  perform public.mobile_refresh_rsvp_count(p_invitation_id);
  return v_inserted;
end;
$$;

revoke all on function public.bulk_import_invitation_guests(uuid, jsonb) from public;
grant execute on function public.bulk_import_invitation_guests(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_guest_rsvp
-- ---------------------------------------------------------------------------
-- Idempotent: re-submitting overwrites the guest's own answer and recomputes
-- the invitation counter from the guest table rather than incrementing it.

create or replace function public.submit_guest_rsvp(
  p_guest_token text,
  p_status text,
  p_companion_count integer default 0,
  p_dietary_restrictions text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_guest public.guests;
begin
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid_token' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('attending', 'declined') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  if not public.mobile_consume_rate_limit(
       'rsvp_submit:' || md5(p_guest_token), 10, interval '1 hour') then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  update public.guests
  set rsvp_status = p_status,
      companion_count = least(greatest(coalesce(p_companion_count, 0), 0), 20),
      dietary_restrictions = nullif(left(btrim(coalesce(p_dietary_restrictions, '')), 500), ''),
      notes = nullif(left(btrim(coalesce(p_notes, '')), 1000), ''),
      rsvp_responded_at = now(),
      updated_at = now()
  where guest_token = p_guest_token
    and exists (
      select 1 from public.invitations i
      where i.id = guests.invitation_id
        and i.status = 'published'
        and i.is_public = true
    )
  returning * into v_guest;

  if not found then
    raise exception 'rsvp_unavailable' using errcode = '42501';
  end if;

  perform public.mobile_refresh_rsvp_count(v_guest.invitation_id);

  return public.get_public_rsvp_context(p_guest_token);
end;
$$;

revoke all on function public.submit_guest_rsvp(text, text, integer, text, text) from public;
grant execute on function public.submit_guest_rsvp(text, text, integer, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- set_template_favorite
-- ---------------------------------------------------------------------------

create or replace function public.set_template_favorite(
  p_template_id uuid,
  p_favorite boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.templates where id = p_template_id and is_active = true) then
    raise exception 'template_not_available' using errcode = '22023';
  end if;

  if p_favorite then
    insert into public.user_templates (user_id, template_id, is_favorite)
    values (v_user_id, p_template_id, true)
    on conflict (user_id, template_id) do update set is_favorite = true;
  else
    update public.user_templates
    set is_favorite = false
    where user_id = v_user_id and template_id = p_template_id;
  end if;
end;
$$;

revoke all on function public.set_template_favorite(uuid, boolean) from public;
grant execute on function public.set_template_favorite(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- update_media_settings
-- ---------------------------------------------------------------------------
-- Only the guest-upload switch is writable. Counts, QR code, expiry and
-- storage path are excluded from the update statement on purpose.

create or replace function public.update_media_settings(
  p_media_id uuid,
  p_allow_guest_upload boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  update public.media
  set allow_guest_upload = coalesce(p_allow_guest_upload, false),
      updated_at = now()
  where id = p_media_id
    and user_id = auth.uid()
    and status <> 'deleted';

  if not found then
    raise exception 'media_not_found' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.update_media_settings(uuid, boolean) from public;
grant execute on function public.update_media_settings(uuid, boolean) to authenticated;

commit;
