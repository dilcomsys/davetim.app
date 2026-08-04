-- Remove the direct write paths that the mobile RPCs replace.
--
-- Split out of 20260803090500_security_hardening.sql because it has a
-- prerequisite the rest of the hardening does not: the replacement RPCs in
-- 20260803090200 and 20260803090300 must already exist, or owners lose the
-- ability to write their own rows with nothing to write through.
--
-- Findings H2 and H3 in docs/engineering/SECURITY-FINDINGS-2026-08-03.md.

begin;

-- Existing policies let an authenticated user write these tables directly with
-- nothing but `user_id = auth.uid()`. That satisfies ownership but not the
-- invariants: the same statement can also set is_public, status, view_count,
-- rsvp_count, slug and published_at, which is exactly the escalation the
-- mobile contract forbids.
--
-- The mobile client never issues these writes. Apply this section only after
-- 20260803090200 and 20260803090300 are in place, so the replacement RPCs
-- exist before the direct paths disappear.

drop policy if exists "Users can create own invitations" on public.invitations;
drop policy if exists "Users can update own invitations" on public.invitations;
drop policy if exists "Users can delete own invitations" on public.invitations;

drop policy if exists "Users can create guests for own invitations" on public.guests;
drop policy if exists "Users can update guests of own invitations" on public.guests;
drop policy if exists "Users can delete guests of own invitations" on public.guests;

drop policy if exists "Users can create own media" on public.media;
drop policy if exists "Users can update own media" on public.media;
drop policy if exists "Users can delete own media" on public.media;
drop policy if exists "Users can delete uploads for own media" on public.guest_uploads;

drop policy if exists "Users can save templates" on public.user_templates;
drop policy if exists "Users can update their saved templates" on public.user_templates;
drop policy if exists "Users can delete their saved templates" on public.user_templates;

-- Entitlement escalation: a user can insert their own subscriptions row and
-- choose the tier, and can insert arbitrary payment_history rows. Mobile
-- ignores both tables, and no client should be able to grant itself a plan.
drop policy if exists "Users can insert own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription" on public.subscriptions;
drop policy if exists "Users can insert own payment history" on public.payment_history;

commit;
