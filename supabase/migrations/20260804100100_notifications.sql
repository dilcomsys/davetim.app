-- Push notifications: device registry, an outbox, and the triggers that fill it.
--
-- Design notes worth keeping:
--
--  * The message text is composed here, at enqueue time, not in the Edge
--    Function. The database is the only place that can see the guest's name and
--    the invitation's title under the right ownership rules; making the
--    dispatcher compose text would mean handing it read access to guest PII for
--    no reason. It only moves rows.
--
--  * The outbox is the unit of delivery, not the guest row. A trigger that
--    pushed directly would tie the RSVP transaction's success to a third-party
--    HTTP call — a guest's answer must never fail because Expo is slow.
--
--  * Nothing here carries a secret. The dispatcher takes no instruction from
--    its caller; it flushes what the database already decided to send. That is
--    what lets it be called without embedding a key in a trigger body, which is
--    exactly how the retired cron job leaked the service role key.

begin;

-- ---------------------------------------------------------------------------
-- Device registry
-- ---------------------------------------------------------------------------

create table if not exists public.device_push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_idx on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

drop policy if exists device_push_tokens_owner_read on public.device_push_tokens;
create policy device_push_tokens_owner_read on public.device_push_tokens
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.device_push_tokens from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Preferences
-- ---------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rsvp_enabled boolean not null default true,
  media_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_owner_read on public.notification_preferences;
create policy notification_preferences_owner_read on public.notification_preferences
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.notification_preferences from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Outbox
-- ---------------------------------------------------------------------------

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('rsvp_attending', 'rsvp_declined', 'guest_media')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (created_at)
  where status = 'pending';

alter table public.notification_outbox enable row level security;
-- No policy at all: only the dispatcher, running as a secret key, touches this.
revoke all on public.notification_outbox from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Client-facing RPCs
-- ---------------------------------------------------------------------------

create or replace function public.register_push_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  -- Expo tokens look like ExponentPushToken[xxxxxxxx] or ExpoPushToken[...].
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[^\]]{8,}\]$' then
    raise exception 'invalid_token' using errcode = '22023';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'unsupported_action' using errcode = '22023';
  end if;

  -- The token is the primary key, so a device that changes hands re-points to
  -- the new account instead of quietly delivering the previous owner's guests.
  insert into public.device_push_tokens (token, user_id, platform)
  values (p_token, v_user, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();

  insert into public.notification_preferences (user_id)
  values (v_user)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  delete from public.device_push_tokens
  where token = p_token and user_id = auth.uid();
end;
$$;

create or replace function public.set_notification_preferences(
  p_rsvp_enabled boolean,
  p_media_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row public.notification_preferences;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  insert into public.notification_preferences (user_id, rsvp_enabled, media_enabled)
  values (v_user, coalesce(p_rsvp_enabled, true), coalesce(p_media_enabled, true))
  on conflict (user_id) do update
    set rsvp_enabled = excluded.rsvp_enabled,
        media_enabled = excluded.media_enabled,
        updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'rsvpEnabled', v_row.rsvp_enabled,
    'mediaEnabled', v_row.media_enabled
  );
end;
$$;

create or replace function public.get_notification_preferences()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.notification_preferences;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select * into v_row from public.notification_preferences where user_id = auth.uid();
  return jsonb_build_object(
    'rsvpEnabled', coalesce(v_row.rsvp_enabled, true),
    'mediaEnabled', coalesce(v_row.media_enabled, true)
  );
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
revoke all on function public.set_notification_preferences(boolean, boolean) from public, anon;
revoke all on function public.get_notification_preferences() from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;
grant execute on function public.set_notification_preferences(boolean, boolean) to authenticated;
grant execute on function public.get_notification_preferences() to authenticated;

-- ---------------------------------------------------------------------------
-- Enqueue helper and triggers
-- ---------------------------------------------------------------------------

create or replace function public.mobile_enqueue_notification(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefs public.notification_preferences;
  v_allowed boolean := true;
begin
  if p_user_id is null then return; end if;

  select * into v_prefs from public.notification_preferences where user_id = p_user_id;
  if found then
    v_allowed := case
      when p_kind in ('rsvp_attending', 'rsvp_declined') then v_prefs.rsvp_enabled
      when p_kind = 'guest_media' then v_prefs.media_enabled
      else true
    end;
  end if;

  -- A muted category still records the row, marked skipped: it keeps the
  -- delivery history honest and makes "why did I not get this" answerable.
  insert into public.notification_outbox (user_id, kind, title, body, data, status)
  values (p_user_id, p_kind, p_title, p_body, coalesce(p_data, '{}'::jsonb),
          case when v_allowed then 'pending' else 'skipped' end);
end;
$$;

revoke all on function public.mobile_enqueue_notification(uuid, text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.mobile_on_guest_rsvp_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.invitations;
  v_kind text;
  v_companions text := '';
begin
  -- Only a real transition into an answer. An edit to a note on an already
  -- answered guest is not news, and re-notifying on every update would make the
  -- feature something people turn off.
  if new.rsvp_status is not distinct from old.rsvp_status then
    return new;
  end if;
  if new.rsvp_status not in ('attending', 'declined') then
    return new;
  end if;

  select * into v_invitation from public.invitations where id = new.invitation_id;
  if not found then return new; end if;

  v_kind := case when new.rsvp_status = 'attending' then 'rsvp_attending' else 'rsvp_declined' end;
  if new.rsvp_status = 'attending' and coalesce(new.companion_count, 0) > 0 then
    v_companions := format(' (+%s kişi)', new.companion_count);
  end if;

  perform public.mobile_enqueue_notification(
    v_invitation.user_id,
    v_kind,
    v_invitation.title,
    case
      when new.rsvp_status = 'attending' then format('%s katılıyor%s.', new.full_name, v_companions)
      else format('%s katılamıyor.', new.full_name)
    end,
    jsonb_build_object('invitationId', v_invitation.id, 'route', format('/invitation/%s', v_invitation.id))
  );

  return new;
end;
$$;

drop trigger if exists guests_rsvp_notify on public.guests;
create trigger guests_rsvp_notify
  after update of rsvp_status on public.guests
  for each row
  execute function public.mobile_on_guest_rsvp_change();

create or replace function public.mobile_on_guest_upload()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media public.media;
begin
  select * into v_media from public.media where id = new.media_id;
  if not found then return new; end if;

  perform public.mobile_enqueue_notification(
    v_media.user_id,
    'guest_media',
    coalesce(v_media.title, 'Etkinlik galerisi'),
    format('%s galeriye yeni bir %s ekledi.',
           coalesce(nullif(btrim(new.guest_name), ''), 'Bir davetli'),
           case when new.type = 'video' then 'video' else 'fotoğraf' end),
    jsonb_build_object('invitationId', v_media.invitation_id,
                       'route', format('/media/manage/%s', v_media.invitation_id))
  );

  return new;
end;
$$;

drop trigger if exists guest_uploads_notify on public.guest_uploads;
create trigger guest_uploads_notify
  after insert on public.guest_uploads
  for each row
  execute function public.mobile_on_guest_upload();

-- ---------------------------------------------------------------------------
-- Dispatcher support
-- ---------------------------------------------------------------------------

-- Claims a batch and hands back the device tokens to deliver to. Claiming and
-- reading in one statement means two dispatcher runs cannot send the same row
-- twice.
create or replace function public.mobile_claim_notifications(p_limit integer default 50)
returns table (
  id uuid,
  title text,
  body text,
  data jsonb,
  tokens text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with claimed as (
    update public.notification_outbox o
    set attempts = o.attempts + 1
    where o.id in (
      select c.id from public.notification_outbox c
      where c.status = 'pending' and c.attempts < 3
      order by c.created_at
      for update skip locked
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    )
    returning o.id, o.user_id, o.title, o.body, o.data
  )
  select c.id, c.title, c.body, c.data,
         coalesce(array_agg(t.token) filter (where t.token is not null), '{}') as tokens
  from claimed c
  left join public.device_push_tokens t on t.user_id = c.user_id
  group by c.id, c.title, c.body, c.data;
end;
$$;

create or replace function public.mobile_settle_notification(
  p_id uuid,
  p_status text,
  p_invalid_tokens text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  update public.notification_outbox
  set status = p_status,
      sent_at = case when p_status = 'sent' then now() else sent_at end
  where id = p_id;

  -- Expo reports tokens that no longer belong to an install. Keeping them means
  -- every future send carries a known-dead recipient.
  if array_length(p_invalid_tokens, 1) is not null then
    delete from public.device_push_tokens where token = any (p_invalid_tokens);
  end if;
end;
$$;

revoke all on function public.mobile_claim_notifications(integer) from public, anon, authenticated;
revoke all on function public.mobile_settle_notification(uuid, text, text[]) from public, anon, authenticated;

commit;
