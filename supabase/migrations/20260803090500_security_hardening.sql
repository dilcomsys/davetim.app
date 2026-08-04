-- Security hardening for the live davetim-app project.
--
-- Written from an inspection of project lwowqdxysoqrwoylhouy on 2026-08-03.
-- Every object named below was verified to exist; nothing here is speculative.
--
-- What this fixes, in severity order. Each item is reachable today with
-- nothing but the publishable (anon) key:
--
--   1. The `http` extension lives in `public`, so PostgREST exposes
--      /rest/v1/rpc/http_get and friends to `anon`. That is arbitrary
--      server-side HTTP from inside the database.
--   2. public.guests has an UPDATE policy with USING(true) WITH CHECK(true)
--      granted to `public`. Anonymous callers can rewrite every guest row and,
--      because PostgREST can return the updated rows, read all guest PII.
--   3. Storage: qr-media is a private bucket but carries three broad SELECT
--      policies for `public`, so anon can list and download every guest photo
--      and video. anon can also insert into guest/ without any quota.
--   4. Nine SECURITY DEFINER functions are executable by anon, including
--      get_expiring_subscriptions (subscriber e-mail list),
--      create_user_subscription(uuid) and reset_monthly_counters().
--   5. public.templates grants INSERT and UPDATE with `true` to every
--      authenticated user, so any account can overwrite the template catalogue.
--   6. public.media and public.guest_uploads expose rows to anon.
--
-- Compatibility warning: items 2, 3, 5 and 6 remove the paths the retired web
-- client used. Confirm no legacy web deployment is still serving traffic
-- before applying. The mobile client does not use any of them; it goes
-- through the RPCs in 20260803090200_mobile_write_rpcs.sql and the Edge
-- Functions in supabase/functions.

begin;

-- ---------------------------------------------------------------------------
-- 1. Arbitrary HTTP from the database
-- ---------------------------------------------------------------------------
-- Two corrections learned while applying this on production:
--
--   a. `revoke ... from anon, authenticated` does nothing here. PostgreSQL
--      grants EXECUTE on every function to PUBLIC, and both roles inherit it.
--      The grant has to come off PUBLIC.
--   b. Even that fails for the http extension: its functions are owned by
--      supabase_admin, and a migration runs as postgres, which cannot revoke
--      another owner's grants. REVOKE by a non-owner is a warning, not an
--      error, so it looks like it worked.
--
-- The extension is unused — no function body in public, auth or storage
-- references http_*, and no cron job does either — so it is dropped outright.
-- Re-enable it from Dashboard > Database > Extensions if it is ever needed,
-- into the `extensions` schema rather than `public`.
--
-- Always verify with has_function_privilege('anon', oid, 'execute') afterwards.

drop extension if exists http;

-- ---------------------------------------------------------------------------
-- 2. Guest tables writable by anyone
-- ---------------------------------------------------------------------------
-- RSVP now runs through public.submit_guest_rsvp, which verifies the guest
-- token, rate limits, and writes only the RSVP columns.

drop policy if exists "Guests can update own RSVP by token" on public.guests;
drop policy if exists "Anyone can update invitation guests" on public.invitation_guests;

-- ---------------------------------------------------------------------------
-- 3. Storage
-- ---------------------------------------------------------------------------
-- qr-media: no end-user role gets SELECT. Signed URLs bypass RLS, so the
-- media Edge Functions keep working. Guest uploads move to upload tickets, so
-- the unmetered anon INSERT is removed.

drop policy if exists "Anyone can view qr-media" on storage.objects;
drop policy if exists "qr-media: anyone can view via signed URL" on storage.objects;
drop policy if exists "qr-media: public read" on storage.objects;
drop policy if exists "qr-media: anon insert to guest folder" on storage.objects;
drop policy if exists "qr-media: authenticated insert to guest folder" on storage.objects;
drop policy if exists "qr-media: authenticated users can upload to guest folder" on storage.objects;
drop policy if exists "Authenticated users can upload to qr-media" on storage.objects;
drop policy if exists "qr-media: user can insert to own folder" on storage.objects;
drop policy if exists "qr-media: user can update own folder" on storage.objects;
drop policy if exists "qr-media: authenticated users can update own files" on storage.objects;
drop policy if exists "Users can update own files in qr-media" on storage.objects;
drop policy if exists "qr-media: authenticated users can delete own files" on storage.objects;
drop policy if exists "Users can delete own files in qr-media" on storage.objects;

-- invitation-images and templates stay public buckets, so their objects are
-- still reachable at /storage/v1/object/public/... . Dropping the broad SELECT
-- policies only removes the ability to *list* the buckets through the API.

drop policy if exists "Anyone can view invitation-images" on storage.objects;
drop policy if exists "Public can view images" on storage.objects;
drop policy if exists "Users can view their own images" on storage.objects;
drop policy if exists "Public can view template images" on storage.objects;

-- Direct uploads are replaced by invitation-image-upload-ticket.
drop policy if exists "Authenticated users can upload to invitation-images" on storage.objects;
drop policy if exists "Users can upload invitation images" on storage.objects;
drop policy if exists "Users can update own files in invitation-images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete own files in invitation-images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

-- The templates bucket is an admin surface. It must not be writable by every
-- signed-in account.
drop policy if exists "Authenticated users can upload template images" on storage.objects;
drop policy if exists "Authenticated users can update template images" on storage.objects;
drop policy if exists "Authenticated users can delete template images" on storage.objects;

-- The last direct write path into the private bucket. Uploads go through
-- media-upload-ticket, which enforces MIME, size, quota and consent before
-- issuing a single-use signed URL.
drop policy if exists "qr-media: authenticated users can upload to own folder" on storage.objects;

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER functions exposed to anon
-- ---------------------------------------------------------------------------
-- These are operational or trigger helpers. None of them is called by the
-- mobile client. service_role and postgres keep execute, so scheduled jobs and
-- Edge Functions are unaffected.

revoke execute on function public.create_user_subscription(uuid) from public, anon, authenticated;
revoke execute on function public.get_user_stats(uuid) from public, anon, authenticated;
revoke execute on function public.update_storage_usage(uuid) from public, anon, authenticated;
revoke execute on function public.reset_monthly_counters() from public, anon, authenticated;
revoke execute on function public.clean_expired_media() from public, anon, authenticated;
revoke execute on function public.cleanup_old_notifications() from public, anon, authenticated;
revoke execute on function public.get_expiring_subscriptions() from public, anon, authenticated;
revoke execute on function public.get_expiring_subscriptions_with_tracking() from public, anon, authenticated;
revoke execute on function public.record_subscription_notification(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Counter helpers. The mobile read models increment counters themselves under
-- a rate limit, so no client needs these.
revoke execute on function public.increment_invitation_views(uuid) from public, anon, authenticated;
revoke execute on function public.increment_invitation_count(uuid) from public, anon, authenticated;
revoke execute on function public.increment_media_view_count(uuid) from public, anon, authenticated;
revoke execute on function public.increment_media_scan_count(text) from public, anon, authenticated;
revoke execute on function public.increment_template_usage(uuid) from public, anon, authenticated;
revoke execute on function public.inc_guest_uploads_count(uuid) from public, anon, authenticated;

-- Trigger functions are never called over the API.
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.update_user_templates_updated_at() from public, anon, authenticated;

-- Still reachable on purpose: generate_invitation_slug and
-- get_invitation_guest_stats are SECURITY INVOKER, so RLS applies to them.

-- ---------------------------------------------------------------------------
-- 5. Template catalogue writable by any account
-- ---------------------------------------------------------------------------

drop policy if exists "Only authenticated users can insert templates" on public.templates;
drop policy if exists "Only authenticated users can update templates" on public.templates;

-- ---------------------------------------------------------------------------
-- 6. media and guest_uploads exposed to anon
-- ---------------------------------------------------------------------------
-- Both tables are read through get_owner_media_context / get_public_media_context,
-- which are security definer and return projections.

drop policy if exists "Public media access by QR" on public.media;
drop policy if exists "Anyone can view guest uploads by QR" on public.guest_uploads;
drop policy if exists "Public can upload to media" on public.guest_uploads;

-- ---------------------------------------------------------------------------
-- 7. subscription_notifications insertable by anyone
-- ---------------------------------------------------------------------------
-- The policy name claims service_role, but it is granted to `public` with
-- WITH CHECK (true). service_role bypasses RLS and does not need a policy.

drop policy if exists "Service role can insert notifications" on public.subscription_notifications;

-- ---------------------------------------------------------------------------
-- 8. Mutable search_path on existing functions
-- ---------------------------------------------------------------------------
-- Clears the 20 function_search_path_mutable advisor warnings. This changes
-- name resolution only; no function body is modified.

do $$
declare
  v_fn record;
begin
  for v_fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proconfig is null
      and p.proname in (
        'update_updated_at_column', 'handle_new_user', 'generate_invitation_slug',
        'increment_invitation_views', 'increment_invitation_count',
        'get_invitation_guest_stats', 'increment_template_usage',
        'increment_media_scan_count', 'increment_media_view_count',
        'inc_guest_uploads_count', 'get_user_stats', 'create_user_subscription',
        'reset_monthly_counters', 'clean_expired_media', 'update_storage_usage',
        'update_user_templates_updated_at', 'get_expiring_subscriptions',
        'get_expiring_subscriptions_with_tracking',
        'record_subscription_notification', 'cleanup_old_notifications'
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp', v_fn.signature);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Duplicate policies
-- ---------------------------------------------------------------------------
-- Each pair below evaluates the same predicate twice on every row.

-- Both anonymous read policies on invitations are removed, not just the
-- duplicate. Either one exposes the full 25-column row — owner user_id and
-- password_hash included — for every published invitation, and lets anyone
-- with the publishable key enumerate them all. Anonymous reads go through
-- get_public_invitation, which is security definer and returns a projection.
drop policy if exists "Anyone can read published invitations" on public.invitations;
drop policy if exists "Anyone can view published invitations" on public.invitations;
drop policy if exists "Users can insert own invitations" on public.invitations;
drop policy if exists "Users can view own saved templates" on public.user_templates;
drop policy if exists "Users can create own saved templates" on public.user_templates;
drop policy if exists "Users can update own saved templates" on public.user_templates;
drop policy if exists "Users can delete own saved templates" on public.user_templates;

-- Dead policies on the legacy guest table. anon and authenticated hold no
-- grants on it after 20260803090600, so these were already unreachable.
drop policy if exists "Users can create guests for own invitations" on public.invitation_guests;
drop policy if exists "Users can update guests of own invitations" on public.invitation_guests;
drop policy if exists "Users can delete guests of own invitations" on public.invitation_guests;
drop policy if exists "Users can view guests of own invitations" on public.invitation_guests;

commit;

-- ---------------------------------------------------------------------------
-- Not fixable in SQL
-- ---------------------------------------------------------------------------
-- Leaked-password protection is disabled. Enable it in
-- Dashboard > Authentication > Policies > Password protection. It checks new
-- passwords against HaveIBeenPwned and cannot be set through a migration.
