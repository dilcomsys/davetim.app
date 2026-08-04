-- Decommission the retired web payment/subscription machinery.
--
-- The mobile release monetises with rewarded ads only. In-app purchases arrive
-- in a later release and will not reuse this schema: the parity document
-- already rules that legacy subscription state cannot unlock mobile features.
--
-- Data is preserved. Eight subscription rows and five payment records are real
-- history and stay in place; what is removed is the *reachability* — grants,
-- functions and scheduled jobs — so nothing keeps running or can be called.
--
-- Verified against the live catalogue on 2026-08-03: none of the functions
-- dropped below backs a trigger, and none is called by apps/mobile.

begin;

-- ---------------------------------------------------------------------------
-- Scheduled jobs
-- ---------------------------------------------------------------------------
-- Job 1 expires paid tiers nightly. Job 2 posts to the
-- subscription-expiration-reminder Edge Function and e-mails subscribers.
-- With no paid plan on sale, both act on a product that no longer exists, and
-- job 2 sends mail to real users about it.
--
-- Job 2 also embeds a service role key directly in cron.job.command. Rotate
-- that key after unscheduling; unscheduling removes the row, but the key was
-- stored in plaintext and should be treated as exposed.

do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.unschedule('daily_subscription_expiration_check');
    perform cron.unschedule('subscription-expiration-reminder');
  end if;
exception
  when others then
    raise notice 'cron jobs already removed or cron unavailable';
end;
$$;

-- ---------------------------------------------------------------------------
-- Subscription and payment functions
-- ---------------------------------------------------------------------------

drop function if exists public.create_user_subscription(uuid);
drop function if exists public.get_expiring_subscriptions();
drop function if exists public.get_expiring_subscriptions_with_tracking();
drop function if exists public.record_subscription_notification(uuid, uuid, text, text);
drop function if exists public.cleanup_old_notifications();
drop function if exists public.reset_monthly_counters();
drop function if exists public.update_storage_usage(uuid);
drop function if exists public.get_user_stats(uuid);

-- ---------------------------------------------------------------------------
-- Counter and helper functions the mobile contract replaces
-- ---------------------------------------------------------------------------
-- Each of these has a mobile equivalent that applies a rate limit and an
-- ownership check:
--   increment_invitation_views  -> counted inside get_public_invitation
--   increment_media_scan_count  -> counted inside mobile_public_media_context
--   inc_guest_uploads_count     -> counted inside mobile_record_media_upload
--   generate_invitation_slug    -> mobile_generate_invitation_slug
--   get_invitation_guest_stats  -> derived client-side from the guest list

drop function if exists public.increment_invitation_views(uuid);
drop function if exists public.increment_invitation_count(uuid);
drop function if exists public.increment_media_view_count(uuid);
drop function if exists public.increment_media_scan_count(text);
drop function if exists public.increment_template_usage(uuid);
drop function if exists public.inc_guest_uploads_count(uuid);
drop function if exists public.generate_invitation_slug(text, uuid);
drop function if exists public.get_invitation_guest_stats(uuid);

-- clean_expired_media deletes storage-backed rows without touching storage,
-- which leaves orphaned objects. The replacement sweep is described in
-- docs/engineering/BACKEND-IMPLEMENTATION.md.
drop function if exists public.clean_expired_media();

-- Kept on purpose, because triggers depend on them:
--   update_updated_at_column          (7 tables)
--   update_user_templates_updated_at  (user_templates)
--   handle_new_user                   (auth.users -> free subscriptions row)

-- ---------------------------------------------------------------------------
-- Table reachability
-- ---------------------------------------------------------------------------
-- Revoking the table grants is stronger than dropping policies: PostgREST
-- cannot expose a relation the role has no privilege on, so these tables leave
-- the API surface entirely while their rows stay readable to service_role.

revoke all on table public.subscriptions from public, anon, authenticated;
revoke all on table public.payment_history from public, anon, authenticated;
revoke all on table public.subscription_notifications from public, anon, authenticated;

-- handle_new_user still inserts a free-tier row per signup. It runs as
-- SECURITY DEFINER, so the revoke above does not affect it.

-- The legacy guest table was never migrated and holds no rows. Mobile writes
-- only public.guests.
revoke all on table public.invitation_guests from public, anon, authenticated;

comment on table public.subscriptions is
  'Retired web billing state. Read-only history; mobile features never consult it.';
comment on table public.payment_history is
  'Retired Iyzico payment history. Read-only; no mobile purchase path exists.';
comment on table public.invitation_guests is
  'Legacy duplicate of public.guests. Empty and unreachable; kept for audit only.';

commit;

-- ---------------------------------------------------------------------------
-- Follow-up outside SQL
-- ---------------------------------------------------------------------------
-- 1. Delete the subscription-expiration-reminder Edge Function. Its only
--    caller was cron job 2, removed above.
--       supabase functions delete subscription-expiration-reminder
-- 2. Decide on contact-form. The retired web contact page was its only caller;
--    mobile support is a mailto link. Delete it or leave it dormant.
-- 3. Rotate the service role key that was embedded in cron job 2.
