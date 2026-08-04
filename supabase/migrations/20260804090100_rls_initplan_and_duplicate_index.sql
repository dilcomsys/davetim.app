-- Evaluate auth.uid() once per query instead of once per row, and drop a
-- duplicated index.
--
-- Postgres treats a bare `auth.uid()` inside a policy as a per-row expression,
-- so a policy written `user_id = auth.uid()` re-runs the function for every row
-- the query touches. Wrapping it in a scalar subquery — `(select auth.uid())` —
-- makes it an InitPlan, evaluated once and reused. Same predicate, same access,
-- measurably less work as the tables grow. Flagged by the Supabase performance
-- advisor on all eleven policies below.
--
-- The policies are recreated rather than altered because Postgres has no
-- ALTER POLICY that rewrites only part of a predicate, and dropping plus
-- recreating inside one transaction leaves no window where the table is
-- readable without a policy.

begin;

-- Owner-read policies on the tables the mobile client actually reads.
drop policy if exists "Users can view own invitations" on public.invitations;
create policy "Users can view own invitations" on public.invitations
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own media" on public.media;
create policy "Users can view own media" on public.media
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own saved templates" on public.user_templates;
create policy "Users can view their own saved templates" on public.user_templates
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view guests of own invitations" on public.guests;
create policy "Users can view guests of own invitations" on public.guests
  for select using (exists (
    select 1 from public.invitations
    where invitations.id = guests.invitation_id
      and invitations.user_id = (select auth.uid())
  ));

drop policy if exists "Users can view uploads for own media" on public.guest_uploads;
create policy "Users can view uploads for own media" on public.guest_uploads
  for select using (exists (
    select 1 from public.media
    where media.id = guest_uploads.media_id
      and media.user_id = (select auth.uid())
  ));

-- Reward bookkeeping. Read-only to the owner; writes stay with the definer RPCs.
drop policy if exists reward_intents_owner_read on public.reward_intents;
create policy reward_intents_owner_read on public.reward_intents
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists reward_receipts_owner_read on public.reward_receipts;
create policy reward_receipts_owner_read on public.reward_receipts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists account_deletion_requests_owner_read on public.account_deletion_requests;
create policy account_deletion_requests_owner_read on public.account_deletion_requests
  for select to authenticated using (user_id = (select auth.uid()));

-- Retired billing tables. Their grants are already revoked, so these policies
-- are unreachable from PostgREST; they are rewritten anyway so a future
-- re-grant does not quietly reintroduce the per-row call.
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own payment history" on public.payment_history;
create policy "Users can view own payment history" on public.payment_history
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own notifications" on public.subscription_notifications;
create policy "Users can view own notifications" on public.subscription_notifications
  for select using ((select auth.uid()) = user_id);

-- `idx_media_qr_code` and `media_qr_code_idx` are the same index on the same
-- column. Two copies double the write cost of every media row for no read
-- benefit. Keep the one the mobile migrations created.
drop index if exists public.idx_media_qr_code;

commit;
