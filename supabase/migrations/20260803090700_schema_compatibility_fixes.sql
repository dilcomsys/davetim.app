-- Compatibility fixes found by diffing the mobile RPCs against the live column
-- types on 2026-08-03. Each of these is a hard failure at first use, not a
-- style issue — the RPCs were written against the legacy TypeScript interfaces
-- rather than the actual catalogue.
--
--   1. invitations.template_id is NOT NULL, but the client offers a blank
--      draft and passes templateId: null.
--   2. media.type, guest_uploads.type and guests.rsvp_status are enums.
--      PostgreSQL does not cast text to an enum in assignment context, so
--      every insert that passed a text variable would raise 42804.
--   3. media.storage_url and guest_uploads.storage_url are NOT NULL, but the
--      mobile contract stores object paths and mints signed URLs on read.
--   4. event_date is `date` and event_time is `time`. There is no assignment
--      cast from text at all, so create_invitation_draft and
--      save_invitation_document failed outright; the explicit casts live in
--      20260803090200 and the format check lives here.
--
-- rsvp_status also carries two legacy labels the mobile client never writes:
-- not_attending and maybe. They are left in the enum so existing rows stay
-- valid; the client maps them on read.

begin;

-- 1. Blank drafts. The foreign key is already ON DELETE SET NULL, so the
-- column was always meant to be nullable.
alter table public.invitations alter column template_id drop not null;

-- 3. Paths replace URLs. Legacy rows keep their storage_url; new rows carry a
-- storage_path instead, and the check makes sure a row never has neither.
alter table public.media alter column storage_url drop not null;
alter table public.guest_uploads alter column storage_url drop not null;

alter table public.media drop constraint if exists media_has_storage_reference;
alter table public.media add constraint media_has_storage_reference
  check (storage_url is not null or storage_path is not null);

alter table public.guest_uploads drop constraint if exists guest_uploads_has_storage_reference;
alter table public.guest_uploads add constraint guest_uploads_has_storage_reference
  check (storage_url is not null or storage_path is not null);

-- 4. Validate the event fields before Postgres tries the I/O conversion.
create or replace function public.mobile_assert_document(p_document jsonb)
returns void
language plpgsql
immutable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_date text;
  v_time text;
begin
  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception 'invalid_document' using errcode = '22023';
  end if;

  if pg_column_size(p_document) > 512 * 1024 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;

  if p_document ? 'image_url'
     and jsonb_typeof(p_document -> 'image_url') = 'string'
     and (p_document ->> 'image_url') !~ '^https://' then
    raise exception 'invalid_image_url' using errcode = '22023';
  end if;

  -- event_date is a `date` column and event_time a `time` column. Text is
  -- converted on assignment, so an unchecked value would raise a raw 22007.
  v_date := nullif(btrim(coalesce(p_document ->> 'event_date', '')), '');
  if v_date is not null and v_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid_event_date' using errcode = '22023';
  end if;

  v_time := nullif(btrim(coalesce(p_document ->> 'event_time', '')), '');
  if v_time is not null and v_time !~ '^\d{1,2}:\d{2}(:\d{2})?$' then
    raise exception 'invalid_event_time' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.mobile_assert_document(jsonb) from public, anon, authenticated;

-- 2. Enum casts.
create or replace function public.submit_guest_rsvp(
  p_guest_token text, p_status text, p_companion_count integer default 0,
  p_dietary_restrictions text default null, p_notes text default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_guest public.guests;
begin
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid_token' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('attending', 'declined') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  if not public.mobile_consume_rate_limit('rsvp_submit:' || md5(p_guest_token), 10, interval '1 hour') then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  update public.guests
  set rsvp_status = p_status::public.rsvp_status,
      companion_count = least(greatest(coalesce(p_companion_count, 0), 0), 20),
      dietary_restrictions = nullif(left(btrim(coalesce(p_dietary_restrictions, '')), 500), ''),
      notes = nullif(left(btrim(coalesce(p_notes, '')), 1000), ''),
      rsvp_responded_at = now(),
      updated_at = now()
  where guest_token = p_guest_token
    and exists (
      select 1 from public.invitations i
      where i.id = guests.invitation_id and i.status = 'published' and i.is_public = true
    )
  returning * into v_guest;

  if not found then
    raise exception 'rsvp_unavailable' using errcode = '42501';
  end if;

  perform public.mobile_refresh_rsvp_count(v_guest.invitation_id);

  return public.get_public_rsvp_context(p_guest_token);
end;
$$;
revoke all on function public.submit_guest_rsvp(text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.submit_guest_rsvp(text, text, integer, text, text) to anon, authenticated;

create or replace function public.mobile_record_media_upload(
  p_ticket jsonb, p_actual_size bigint, p_actual_mime text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_scope text := p_ticket ->> 'scope';
  v_kind public.media_type := (p_ticket ->> 'kind')::public.media_type;
  v_media_id uuid;
  v_upload_id uuid;
begin
  if p_actual_size is null or p_actual_size <= 0
     or p_actual_size > (p_ticket ->> 'max_bytes')::bigint then
    raise exception 'file_too_large' using errcode = '22023';
  end if;

  if p_actual_mime is distinct from (p_ticket ->> 'expected_mime') then
    raise exception 'mime_mismatch' using errcode = '22023';
  end if;

  if v_scope = 'owner_media' then
    insert into public.media (
      user_id, invitation_id, type, file_name, file_size, mime_type,
      storage_path, qr_code, title, status,
      allow_guest_upload, guest_uploads_limit, guest_uploads_count, view_count, scan_count
    )
    values (
      (p_ticket ->> 'user_id')::uuid,
      (p_ticket ->> 'invitation_id')::uuid,
      v_kind,
      coalesce(p_ticket #>> '{metadata,fileName}', 'media'),
      p_actual_size,
      p_actual_mime,
      p_ticket ->> 'object_path',
      'QR-' || encode(extensions.gen_random_bytes(12), 'hex'),
      nullif(btrim(coalesce(p_ticket #>> '{metadata,title}', '')), ''),
      'active', false, 50, 0, 0, 0
    )
    returning id into v_media_id;

    return jsonb_build_object('mediaId', v_media_id);

  elsif v_scope = 'guest_media' then
    v_media_id := (p_ticket ->> 'media_id')::uuid;

    -- Re-check the limit inside the transaction that increments it.
    update public.media
    set guest_uploads_count = coalesce(guest_uploads_count, 0) + 1, updated_at = now()
    where id = v_media_id
      and coalesce(guest_uploads_count, 0) < coalesce(guest_uploads_limit, 0);

    if not found then
      raise exception 'guest_upload_limit_reached' using errcode = '53400';
    end if;

    insert into public.guest_uploads (
      media_id, qr_code, guest_name, note, type,
      file_name, file_size, mime_type, storage_path, status, consent_at
    )
    values (
      v_media_id,
      p_ticket ->> 'qr_code',
      nullif(btrim(coalesce(p_ticket #>> '{metadata,guestName}', '')), ''),
      nullif(btrim(coalesce(p_ticket #>> '{metadata,note}', '')), ''),
      v_kind,
      coalesce(p_ticket #>> '{metadata,fileName}', 'upload'),
      p_actual_size, p_actual_mime, p_ticket ->> 'object_path', 'active', now()
    )
    returning id into v_upload_id;

    return jsonb_build_object('uploadId', v_upload_id, 'mediaId', v_media_id);
  end if;

  raise exception 'unsupported_scope' using errcode = '22023';
end;
$$;
revoke all on function public.mobile_record_media_upload(jsonb, bigint, text) from public, anon, authenticated;
grant execute on function public.mobile_record_media_upload(jsonb, bigint, text) to service_role;

commit;
