-- Mobile contract: anonymous and owner read models.
--
-- Every function here returns a constructed jsonb projection. None of them
-- returns a table row, so adding a column to a base table can never widen a
-- public response by accident.
--
-- Key names are snake_case because the client decoders in
-- apps/mobile/src/domain/decoders.ts read snake_case.

begin;

-- ---------------------------------------------------------------------------
-- Shared invitation projection
-- ---------------------------------------------------------------------------
-- Deliberately omits user_id, password_protected, expires_at and every other
-- owner-only column. decodePublicInvitation rejects anything that is not
-- published and public, so status and is_public must stay in the projection.

create or replace function public.mobile_public_invitation_json(p_invitation public.invitations)
returns jsonb
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', p_invitation.id,
    'template_id', p_invitation.template_id,
    'title', p_invitation.title,
    'slug', p_invitation.slug,
    'event_type', p_invitation.event_type,
    'event_date', p_invitation.event_date,
    'event_time', p_invitation.event_time,
    'event_location_name', p_invitation.event_location_name,
    'event_location_address', p_invitation.event_location_address,
    'custom_design', coalesce(p_invitation.custom_design, '{}'::jsonb),
    'content', coalesce(p_invitation.content, '{}'::jsonb),
    'settings', coalesce(p_invitation.settings, '{}'::jsonb),
    'status', p_invitation.status,
    'is_public', p_invitation.is_public,
    'view_count', coalesce(p_invitation.view_count, 0),
    'rsvp_count', coalesce(p_invitation.rsvp_count, 0),
    'image_url', p_invitation.image_url,
    'published_at', p_invitation.published_at,
    'created_at', p_invitation.created_at,
    'updated_at', p_invitation.updated_at
  );
$$;

revoke all on function public.mobile_public_invitation_json(public.invitations) from public;

-- ---------------------------------------------------------------------------
-- get_public_invitation
-- ---------------------------------------------------------------------------
-- Returns null (not an error) for a missing, unpublished or private
-- invitation so the response cannot be used to enumerate draft IDs.
--
-- View counting limitation: SQL cannot see the caller IP, so the counter is
-- capped per invitation per minute rather than deduplicated per device. This
-- bounds inflation; it does not make the counter a unique-visitor metric.

create or replace function public.get_public_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.invitations;
begin
  if p_invitation_id is null then
    return null;
  end if;

  select * into v_invitation
  from public.invitations
  where id = p_invitation_id
    and status = 'published'
    and is_public = true;

  if not found then
    return null;
  end if;

  if public.mobile_consume_rate_limit(
       'invitation_view:' || p_invitation_id::text,
       60,
       interval '1 minute'
     ) then
    update public.invitations
    set view_count = coalesce(view_count, 0) + 1
    where id = p_invitation_id;

    v_invitation.view_count := coalesce(v_invitation.view_count, 0) + 1;
  end if;

  return public.mobile_public_invitation_json(v_invitation);
end;
$$;

revoke all on function public.get_public_invitation(uuid) from public;
grant execute on function public.get_public_invitation(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_public_rsvp_context
-- ---------------------------------------------------------------------------
-- The guest token is the only credential, so the projection must not return
-- the token itself, the guest email or phone, or the invitation owner.

create or replace function public.get_public_rsvp_context(p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_guest public.guests;
  v_invitation public.invitations;
begin
  if p_guest_token is null or length(p_guest_token) < 16 then
    return null;
  end if;

  -- Keyed on a digest so a database dump of the limiter cannot leak tokens.
  if not public.mobile_consume_rate_limit(
       'rsvp_context:' || md5(p_guest_token),
       30,
       interval '1 minute'
     ) then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  select * into v_guest
  from public.guests
  where guest_token = p_guest_token;

  if not found then
    return null;
  end if;

  select * into v_invitation
  from public.invitations
  where id = v_guest.invitation_id
    and status = 'published'
    and is_public = true;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'guest', jsonb_build_object(
      'id', v_guest.id,
      'invitation_id', v_guest.invitation_id,
      'full_name', v_guest.full_name,
      'rsvp_status', v_guest.rsvp_status,
      'companion_count', coalesce(v_guest.companion_count, 0),
      'dietary_restrictions', v_guest.dietary_restrictions,
      'notes', v_guest.notes,
      'rsvp_responded_at', v_guest.rsvp_responded_at
    ),
    'invitation', public.mobile_public_invitation_json(v_invitation)
  );
end;
$$;

revoke all on function public.get_public_rsvp_context(text) from public;
grant execute on function public.get_public_rsvp_context(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_reward_intent_status
-- ---------------------------------------------------------------------------
-- Status polling for the rewarded-ad flow. Returns only the caller's own
-- intent, and only the two fields the client needs.

create or replace function public.get_reward_intent_status(p_intent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_expires_at timestamptz;
  v_receipt_id uuid;
begin
  if auth.uid() is null or p_intent_id is null then
    return null;
  end if;

  select i.status, i.expires_at, r.id
  into v_status, v_expires_at, v_receipt_id
  from public.reward_intents i
  left join public.reward_receipts r on r.intent_id = i.id
  where i.id = p_intent_id
    and i.user_id = auth.uid();

  if not found then
    return null;
  end if;

  if v_status = 'pending' and v_expires_at < now() then
    v_status := 'expired';
  end if;

  return jsonb_build_object('status', v_status, 'receipt_id', v_receipt_id);
end;
$$;

revoke all on function public.get_reward_intent_status(uuid) from public;
grant execute on function public.get_reward_intent_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Media read projections
-- ---------------------------------------------------------------------------
-- These return object paths, not URLs. Signed URLs are minted by the
-- media-context Edge Function, which is the only component with a service
-- role key. Execution is therefore granted to service_role only.

-- Shared media projection. signed_url is intentionally absent here; the Edge
-- Function replaces storage_path with a short-lived signed URL before the
-- payload leaves the server.
create or replace function public.mobile_media_context_json(p_media public.media)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'media', jsonb_build_object(
      'id', p_media.id,
      'invitation_id', p_media.invitation_id,
      'type', p_media.type,
      'file_name', p_media.file_name,
      'file_size', coalesce(p_media.file_size, 0),
      'mime_type', p_media.mime_type,
      'storage_path', p_media.storage_path,
      'qr_code', p_media.qr_code,
      'title', p_media.title,
      'description', p_media.description,
      'expires_at', p_media.expires_at,
      'view_count', coalesce(p_media.view_count, 0),
      'scan_count', coalesce(p_media.scan_count, 0),
      'allow_guest_upload', coalesce(p_media.allow_guest_upload, false),
      'guest_uploads_limit', coalesce(p_media.guest_uploads_limit, 0),
      'guest_uploads_count', coalesce(p_media.guest_uploads_count, 0),
      'status', p_media.status,
      'created_at', p_media.created_at,
      'updated_at', p_media.updated_at
    ),
    'uploads', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'media_id', u.media_id,
          'guest_name', u.guest_name,
          'note', u.note,
          'type', u.type,
          'file_name', u.file_name,
          'file_size', coalesce(u.file_size, 0),
          'mime_type', u.mime_type,
          'storage_path', u.storage_path,
          'created_at', u.created_at
        )
        order by u.created_at desc
      )
      from public.guest_uploads u
      where u.media_id = p_media.id
        and coalesce(u.status, 'active') = 'active'
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.mobile_media_context_json(public.media) from public;

create or replace function public.mobile_owner_media_context(
  p_invitation_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media public.media;
begin
  if p_invitation_id is null or p_user_id is null then
    return null;
  end if;

  if not exists (
    select 1 from public.invitations
    where id = p_invitation_id and user_id = p_user_id
  ) then
    return null;
  end if;

  select * into v_media
  from public.media
  where invitation_id = p_invitation_id
    and user_id = p_user_id
    and status <> 'deleted'
  order by created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  return public.mobile_media_context_json(v_media);
end;
$$;

revoke all on function public.mobile_owner_media_context(uuid, uuid) from public;
grant execute on function public.mobile_owner_media_context(uuid, uuid) to service_role;

create or replace function public.mobile_public_media_context(p_qr_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media public.media;
begin
  if p_qr_code is null or length(p_qr_code) < 8 then
    return null;
  end if;

  select * into v_media
  from public.media
  where qr_code = p_qr_code
    and status = 'active'
    and (expires_at is null or expires_at > now());

  if not found then
    return null;
  end if;

  if public.mobile_consume_rate_limit(
       'media_scan:' || v_media.id::text,
       120,
       interval '1 minute'
     ) then
    update public.media
    set scan_count = coalesce(scan_count, 0) + 1
    where id = v_media.id;

    v_media.scan_count := coalesce(v_media.scan_count, 0) + 1;
  end if;

  return public.mobile_media_context_json(v_media);
end;
$$;

revoke all on function public.mobile_public_media_context(text) from public;
grant execute on function public.mobile_public_media_context(text) to service_role;

commit;
