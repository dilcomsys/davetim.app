-- Mobile contract: rewarded-ad grants, upload tickets, account operations.
--
-- The Edge Functions in supabase/functions hold the service role key. They
-- deliberately contain no invariants: every atomic rule lives in the functions
-- below, so a bug in a function's HTTP layer cannot grant an entitlement,
-- inflate a counter, or complete somebody else's upload.

begin;

-- ---------------------------------------------------------------------------
-- consume_reward_receipt
-- ---------------------------------------------------------------------------
-- Called by the client immediately before it uses a bonus, and by
-- create_invitation_draft for paid-tier templates. Returns false rather than
-- raising so callers can present a fallback instead of an error.

create or replace function public.consume_reward_receipt(
  p_receipt_id uuid,
  p_feature text,
  p_invitation_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_consumed integer;
begin
  if v_user_id is null or p_receipt_id is null or p_feature is null then
    return false;
  end if;

  -- The consumed_at guard makes this atomic: a concurrent second call updates
  -- zero rows because the first call already stamped the receipt.
  with claimed as (
    update public.reward_receipts
    set consumed_at = now(),
        consumed_invitation_id = p_invitation_id
    where id = p_receipt_id
      and user_id = v_user_id
      and feature = p_feature
      and consumed_at is null
      and expires_at > now()
    returning 1
  )
  select count(*) into v_consumed from claimed;

  return v_consumed = 1;
end;
$$;

revoke all on function public.consume_reward_receipt(uuid, text, uuid) from public;
grant execute on function public.consume_reward_receipt(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Reward intent creation and grant (service_role only)
-- ---------------------------------------------------------------------------

create or replace function public.mobile_create_reward_intent(
  p_user_id uuid,
  p_feature text,
  p_platform text,
  p_ad_unit_id text,
  p_context jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nonce text := encode(extensions.gen_random_bytes(24), 'hex');
  v_intent public.reward_intents;
begin
  if p_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Caps how many ads one account can queue, independent of ad-network limits.
  if not public.mobile_consume_rate_limit(
       'reward_intent:' || p_user_id::text, 20, interval '1 hour') then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  -- A context invitation must belong to the caller.
  if p_context ? 'invitationId'
     and nullif(p_context ->> 'invitationId', '') is not null
     and not exists (
       select 1 from public.invitations
       where id = (p_context ->> 'invitationId')::uuid and user_id = p_user_id
     ) then
    raise exception 'invalid_context' using errcode = '22023';
  end if;

  insert into public.reward_intents (
    user_id, feature, platform, ad_unit_id, context, nonce, expires_at
  )
  values (
    p_user_id, p_feature, p_platform, p_ad_unit_id,
    coalesce(p_context, '{}'::jsonb), v_nonce, now() + interval '30 minutes'
  )
  returning * into v_intent;

  -- customData travels to AdMob and returns in the SSV callback. It carries
  -- the nonce only, never the user ID or the feature.
  return jsonb_build_object('intentId', v_intent.id, 'customData', v_nonce);
end;
$$;

revoke all on function public.mobile_create_reward_intent(uuid, text, text, text, jsonb) from public;
grant execute on function public.mobile_create_reward_intent(uuid, text, text, text, jsonb) to service_role;

-- Called only after the AdMob SSV signature has been verified. Idempotent on
-- both the intent and the AdMob transaction ID, so a replayed callback returns
-- the original receipt instead of minting a second one.
create or replace function public.mobile_grant_reward_receipt(
  p_nonce text,
  p_admob_transaction_id text,
  p_admob_user_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.reward_intents;
  v_receipt public.reward_receipts;
begin
  if p_nonce is null or p_admob_transaction_id is null then
    raise exception 'invalid_callback' using errcode = '22023';
  end if;

  select * into v_receipt
  from public.reward_receipts
  where admob_transaction_id = p_admob_transaction_id;

  if found then
    return jsonb_build_object('receiptId', v_receipt.id, 'replayed', true);
  end if;

  select * into v_intent
  from public.reward_intents
  where nonce = p_nonce
  for update;

  if not found then
    raise exception 'intent_not_found' using errcode = '42501';
  end if;

  -- The SSV user_id is the value the client passed to AdMob. It must match the
  -- account that opened the intent, otherwise a reward could be redirected.
  if p_admob_user_id is null or p_admob_user_id <> v_intent.user_id::text then
    update public.reward_intents
    set status = 'rejected', rejected_reason = 'user_mismatch'
    where id = v_intent.id;
    raise exception 'user_mismatch' using errcode = '42501';
  end if;

  if v_intent.expires_at < now() then
    update public.reward_intents
    set status = 'expired'
    where id = v_intent.id and status = 'pending';
    raise exception 'intent_expired' using errcode = '53400';
  end if;

  if v_intent.status <> 'pending' then
    raise exception 'intent_not_pending' using errcode = '53400';
  end if;

  insert into public.reward_receipts (
    intent_id, user_id, feature, context, admob_transaction_id, expires_at
  )
  values (
    v_intent.id, v_intent.user_id, v_intent.feature, v_intent.context,
    p_admob_transaction_id, now() + interval '7 days'
  )
  returning * into v_receipt;

  update public.reward_intents
  set status = 'granted'
  where id = v_intent.id;

  return jsonb_build_object('receiptId', v_receipt.id, 'replayed', false);
end;
$$;

revoke all on function public.mobile_grant_reward_receipt(text, text, text) from public;
grant execute on function public.mobile_grant_reward_receipt(text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Upload tickets (service_role only)
-- ---------------------------------------------------------------------------

create or replace function public.mobile_issue_upload_ticket(
  p_scope text,
  p_user_id uuid,
  p_invitation_id uuid,
  p_qr_code text,
  p_kind text,
  p_mime text,
  p_file_size bigint,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_image_max constant bigint := 10 * 1024 * 1024;
  c_video_max constant bigint := 100 * 1024 * 1024;
  v_max bigint;
  v_bucket text;
  v_path text;
  v_ticket_id text := encode(extensions.gen_random_bytes(24), 'hex');
  v_media public.media;
  v_extension text;
begin
  if p_scope not in ('owner_media', 'guest_media', 'invitation_image') then
    raise exception 'unsupported_scope' using errcode = '22023';
  end if;

  if p_kind not in ('image', 'video') then
    raise exception 'unsupported_kind' using errcode = '22023';
  end if;

  if p_kind = 'image' and p_mime not in
     ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif') then
    raise exception 'unsupported_mime' using errcode = '22023';
  end if;

  if p_kind = 'video' and p_mime not in ('video/mp4', 'video/quicktime', 'video/webm') then
    raise exception 'unsupported_mime' using errcode = '22023';
  end if;

  v_max := case when p_kind = 'video' then c_video_max else c_image_max end;
  if p_file_size is null or p_file_size <= 0 or p_file_size > v_max then
    raise exception 'file_too_large' using errcode = '22023';
  end if;

  v_extension := split_part(p_mime, '/', 2);

  if p_scope = 'invitation_image' then
    if p_kind <> 'image' then
      raise exception 'unsupported_kind' using errcode = '22023';
    end if;
    if p_user_id is null then
      raise exception 'not_authenticated' using errcode = '42501';
    end if;
    if p_invitation_id is not null and not exists (
      select 1 from public.invitations where id = p_invitation_id and user_id = p_user_id
    ) then
      raise exception 'invitation_not_found' using errcode = '42501';
    end if;

    -- invitation-images is a public bucket, so the path must not identify the
    -- uploader. Ownership lives on the ticket row, not in the object name.
    v_bucket := 'invitation-images';
    v_path := 'm/' || encode(extensions.gen_random_bytes(20), 'hex') || '.' || v_extension;

  elsif p_scope = 'owner_media' then
    if p_user_id is null or p_invitation_id is null then
      raise exception 'not_authenticated' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.invitations where id = p_invitation_id and user_id = p_user_id
    ) then
      raise exception 'invitation_not_found' using errcode = '42501';
    end if;

    v_bucket := 'qr-media';
    v_path := p_user_id::text || '/' || p_invitation_id::text || '/'
              || encode(extensions.gen_random_bytes(16), 'hex') || '.' || v_extension;

  else
    select * into v_media
    from public.media
    where qr_code = p_qr_code
      and status = 'active'
      and coalesce(allow_guest_upload, false) = true
      and (expires_at is null or expires_at > now());

    if not found then
      raise exception 'gallery_unavailable' using errcode = '42501';
    end if;

    if coalesce(v_media.guest_uploads_count, 0) >= coalesce(v_media.guest_uploads_limit, 0) then
      raise exception 'guest_upload_limit_reached' using errcode = '53400';
    end if;

    if coalesce(p_metadata ->> 'consent', '') <> 'true' then
      raise exception 'consent_required' using errcode = '42501';
    end if;

    if not public.mobile_consume_rate_limit(
         'guest_upload:' || v_media.id::text, 60, interval '1 hour') then
      raise exception 'rate_limited' using errcode = '53400';
    end if;

    v_bucket := 'qr-media';
    v_path := 'guest/' || v_media.id::text || '/'
              || encode(extensions.gen_random_bytes(16), 'hex') || '.' || v_extension;
  end if;

  insert into public.upload_tickets (
    ticket_hash, scope, user_id, invitation_id, media_id, qr_code,
    bucket_id, object_path, kind, expected_mime, max_bytes, metadata, expires_at
  )
  values (
    encode(extensions.digest(v_ticket_id, 'sha256'), 'hex'),
    p_scope, p_user_id, p_invitation_id, v_media.id, p_qr_code,
    v_bucket, v_path, p_kind, p_mime, v_max,
    coalesce(p_metadata, '{}'::jsonb), now() + interval '15 minutes'
  );

  return jsonb_build_object(
    'ticketId', v_ticket_id,
    'bucket', v_bucket,
    'path', v_path
  );
end;
$$;

revoke all on function public.mobile_issue_upload_ticket(text, uuid, uuid, text, text, text, bigint, jsonb) from public;
grant execute on function public.mobile_issue_upload_ticket(text, uuid, uuid, text, text, text, bigint, jsonb) to service_role;

-- Resolves a ticket for the completion Edge Function. Marks it consumed in the
-- same statement that reads it, so a replayed completion finds nothing.
create or replace function public.mobile_claim_upload_ticket(p_ticket_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.upload_tickets;
begin
  update public.upload_tickets
  set completed_at = now()
  where ticket_hash = encode(extensions.digest(coalesce(p_ticket_id, ''), 'sha256'), 'hex')
    and completed_at is null
    and expires_at > now()
  returning * into v_ticket;

  if not found then
    raise exception 'ticket_not_found' using errcode = '42501';
  end if;

  return to_jsonb(v_ticket);
end;
$$;

revoke all on function public.mobile_claim_upload_ticket(text) from public;
grant execute on function public.mobile_claim_upload_ticket(text) to service_role;

-- Writes the media/guest_uploads row after the Edge Function has re-inspected
-- the stored object. Counters are incremented here, never by the client.
create or replace function public.mobile_record_media_upload(
  p_ticket jsonb,
  p_actual_size bigint,
  p_actual_mime text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_scope text := p_ticket ->> 'scope';
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
      allow_guest_upload, guest_uploads_limit, guest_uploads_count,
      view_count, scan_count
    )
    values (
      (p_ticket ->> 'user_id')::uuid,
      (p_ticket ->> 'invitation_id')::uuid,
      p_ticket ->> 'kind',
      coalesce(p_ticket #>> '{metadata,fileName}', 'media'),
      p_actual_size,
      p_actual_mime,
      p_ticket ->> 'object_path',
      'QR-' || encode(extensions.gen_random_bytes(12), 'hex'),
      nullif(btrim(coalesce(p_ticket #>> '{metadata,title}', '')), ''),
      'active',
      false, 50, 0, 0, 0
    )
    returning id into v_media_id;

    return jsonb_build_object('mediaId', v_media_id);

  elsif v_scope = 'guest_media' then
    v_media_id := (p_ticket ->> 'media_id')::uuid;

    -- Re-check the limit inside the transaction that increments it.
    update public.media
    set guest_uploads_count = coalesce(guest_uploads_count, 0) + 1,
        updated_at = now()
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
      p_ticket ->> 'kind',
      coalesce(p_ticket #>> '{metadata,fileName}', 'upload'),
      p_actual_size,
      p_actual_mime,
      p_ticket ->> 'object_path',
      'active',
      now()
    )
    returning id into v_upload_id;

    return jsonb_build_object('uploadId', v_upload_id, 'mediaId', v_media_id);
  end if;

  raise exception 'unsupported_scope' using errcode = '22023';
end;
$$;

revoke all on function public.mobile_record_media_upload(jsonb, bigint, text) from public;
grant execute on function public.mobile_record_media_upload(jsonb, bigint, text) to service_role;

-- Resolves the object a delete request refers to, and marks the row deleted.
-- The Edge Function removes the storage object afterwards; a retry that finds
-- the row already deleted still returns the path so cleanup is idempotent.
create or replace function public.mobile_delete_guest_upload(
  p_upload_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_path text;
  v_media_id uuid;
  v_already boolean;
begin
  select u.storage_path, u.media_id, coalesce(u.status, 'active') = 'deleted'
  into v_path, v_media_id, v_already
  from public.guest_uploads u
  join public.media m on m.id = u.media_id
  where u.id = p_upload_id
    and m.user_id = p_user_id;

  if not found then
    raise exception 'upload_not_found' using errcode = '42501';
  end if;

  if not v_already then
    update public.guest_uploads set status = 'deleted' where id = p_upload_id;
    update public.media
    set guest_uploads_count = greatest(coalesce(guest_uploads_count, 0) - 1, 0),
        updated_at = now()
    where id = v_media_id;
  end if;

  return jsonb_build_object('bucket', 'qr-media', 'path', v_path);
end;
$$;

revoke all on function public.mobile_delete_guest_upload(uuid, uuid) from public;
grant execute on function public.mobile_delete_guest_upload(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Account operations (service_role only)
-- ---------------------------------------------------------------------------
-- The export deliberately omits guest_token, storage paths, signed URLs,
-- payment payloads and every internal identifier that is not the caller's own
-- content.

create or replace function public.mobile_export_account_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'exportedAt', now(),
    'invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', i.title,
        'slug', i.slug,
        'eventType', i.event_type,
        'eventDate', i.event_date,
        'eventTime', i.event_time,
        'locationName', i.event_location_name,
        'locationAddress', i.event_location_address,
        'content', i.content,
        'settings', i.settings,
        'status', i.status,
        'viewCount', i.view_count,
        'rsvpCount', i.rsvp_count,
        'createdAt', i.created_at
      ) order by i.created_at)
      from public.invitations i where i.user_id = p_user_id
    ), '[]'::jsonb),
    'guests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'invitationTitle', i.title,
        'fullName', g.full_name,
        'email', g.email,
        'phone', g.phone,
        'rsvpStatus', g.rsvp_status,
        'companionCount', g.companion_count,
        'notes', g.notes,
        'respondedAt', g.rsvp_responded_at
      ) order by g.created_at)
      from public.guests g
      join public.invitations i on i.id = g.invitation_id
      where i.user_id = p_user_id
    ), '[]'::jsonb),
    'favoriteTemplates', coalesce((
      select jsonb_agg(t.name order by t.name)
      from public.user_templates ut
      join public.templates t on t.id = ut.template_id
      where ut.user_id = p_user_id and ut.is_favorite = true
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.mobile_export_account_data(uuid) from public;
grant execute on function public.mobile_export_account_data(uuid) to service_role;

create or replace function public.mobile_request_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.account_deletion_requests;
begin
  if p_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_request
  from public.account_deletion_requests
  where user_id = p_user_id and status in ('pending', 'processing');

  if found then
    return jsonb_build_object('status', v_request.status, 'requestedAt', v_request.requested_at);
  end if;

  insert into public.account_deletion_requests (user_id)
  values (p_user_id)
  returning * into v_request;

  -- Content is unpublished immediately so a pending deletion stops serving
  -- public pages, while the retention window runs.
  update public.invitations
  set status = 'archived', is_public = false, updated_at = now()
  where user_id = p_user_id and status <> 'archived';

  return jsonb_build_object('status', v_request.status, 'requestedAt', v_request.requested_at);
end;
$$;

revoke all on function public.mobile_request_account_deletion(uuid) from public;
grant execute on function public.mobile_request_account_deletion(uuid) to service_role;

commit;
