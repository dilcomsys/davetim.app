# Production security findings — 2026-08-03

Source: read-only inspection of the live Supabase project `davetim-app`
(`lwowqdxysoqrwoylhouy`) through the scoped Supabase MCP, plus the project's
own security advisors.

Every finding below was verified against the live catalogue. None of them was
introduced by the mobile client; they are pre-existing configuration from the
retired web product.

**Status: all findings closed on production on 2026-08-03**, except M4, which
is gated to the Pro plan, and L2 for `pg_net`. The Supabase security advisors
went from roughly forty findings to two warnings.

Every fix was verified by re-querying the resulting access, never by assuming
the statement did what it read like. That mattered three times: C1 (two revokes
that silently did nothing), the RPC grants (Supabase default privileges
re-granted `anon` on every new function), and H6 (a policy left in place
because the intended path went elsewhere). Twice the verification step was the
only reason the hole was found at all.

Scale at time of inspection: 15 invitations, 2 guests, 8 subscriptions,
5 payment records, 25 templates, 0 media rows.

## Critical

### C1. Arbitrary server-side HTTP through the anon key

The `http` extension is installed in the `public` schema, and `anon` holds
EXECUTE on every one of its functions. PostgREST therefore exposes
`/rest/v1/rpc/http_get`, `http_post`, `http_put`, `http_delete` and friends to
anyone holding the publishable key, which ships inside the mobile bundle.

That is request forgery originating from inside the database network: cloud
metadata endpoints, internal services, and any host reachable from the
Postgres instance. It also gives an attacker an exfiltration channel for
anything else they can read.

Attempted fix, and why it failed twice:

1. `revoke execute ... from anon, authenticated` changed nothing. PostgreSQL
   grants EXECUTE on every function to `PUBLIC` by default, and both roles
   inherit that. `has_function_privilege('anon', oid, 'execute')` still
   returned true afterwards.
2. `revoke ... from public` also changed nothing. The functions are owned by
   `supabase_admin`; a migration runs as `postgres`, which cannot revoke
   another owner's grants and cannot `set role supabase_admin`. REVOKE by a
   non-owner raises a warning, not an error, so it looks like it succeeded.

Applied fix: `drop extension http`. Verified unused first — no function body in
`public`, `auth` or `storage` references any `http_*` function, and no cron job
does either. Re-enable from Dashboard → Database → Extensions if it is ever
needed, into the `extensions` schema rather than `public`.

**Status: closed.** No function in `public` is executable by `anon`.

### C2. Every guest row is writable by anonymous callers

`public.guests` carries the policy `Guests can update own RSVP by token` for
role `public`, with `USING (true)` and `WITH CHECK (true)`. The name describes
an intent the predicate does not implement: there is no token check at all.

Anyone with the anon key can rewrite every guest row — names, e-mail
addresses, phone numbers, RSVP answers and `guest_token` itself. Because
PostgREST can return the affected rows from an UPDATE, the same request also
reads back the guest PII that the SELECT policy is meant to protect.

`public.invitation_guests` has the identical flaw
(`Anyone can update invitation guests`), currently on an empty table.

Fix: drop both policies. RSVP moves to `public.submit_guest_rsvp`, which
verifies the token, rate limits, and writes only the RSVP columns.

**Status: closed.**

### C3. The private media bucket is readable by anonymous callers

`qr-media` has `public = false`, which only means Supabase serves no
unauthenticated public URL for it. Authorisation for the API still comes from
`storage.objects` policies, and the bucket has three broad SELECT policies
granted to role `public`:

- `Anyone can view qr-media`
- `qr-media: anyone can view via signed URL`
- `qr-media: public read`

Each is `USING (bucket_id = 'qr-media')`. Anyone with the anon key can list and
download every guest photo and video in the bucket. The bucket is empty today,
so this is a design flaw rather than a present-tense breach — but it would
become one on the first guest upload.

The bucket also has `qr-media: anon insert to guest folder`, which lets an
anonymous caller upload unlimited objects under `guest/` with no quota, size
accounting or consent record.

Fix: drop every end-user SELECT and INSERT policy on the bucket. Signed URLs
bypass RLS, so the media Edge Functions keep working; uploads move to
single-use tickets.

**Status: closed.** `storage.objects` now carries no policy at all.

### C4. Operational SECURITY DEFINER functions callable by anon

Ten SECURITY DEFINER functions are executable by `anon` over
`/rest/v1/rpc/...`:

| Function | Effect when called anonymously |
|---|---|
| `get_expiring_subscriptions()` | Returns the subscriber list with e-mail addresses |
| `get_expiring_subscriptions_with_tracking()` | Same, plus notification state |
| `get_user_stats(p_user_id uuid)` | Reads any account's usage by ID |
| `create_user_subscription(p_user_id uuid)` | Creates a subscription row for any user ID |
| `update_storage_usage(p_user_id uuid)` | Rewrites any account's storage accounting |
| `reset_monthly_counters()` | Resets quota counters for every account |
| `clean_expired_media()` | Triggers media deletion |
| `cleanup_old_notifications()` | Deletes notification history |
| `record_subscription_notification(...)` | Writes arbitrary notification rows |
| `handle_new_user()` | Trigger function exposed as an endpoint |

Fix: the nine operational functions are dropped outright in
`20260803090600_decommission_payments.sql`; `handle_new_user` is kept for its
trigger with EXECUTE revoked from `PUBLIC`.

**Status: closed.**

## High

### H1. Any signed-in account can rewrite the template catalogue

`public.templates` grants INSERT with `WITH CHECK (true)` and UPDATE with
`USING (true)` to `authenticated`. Anyone who can sign up can replace all 25
templates, including their image URLs.

The `templates` storage bucket mirrors this: `Authenticated users can
upload/update/delete template images` is scoped only by `auth.role() =
'authenticated'`.

Fix: drop the four policies. Template curation is an operator task and belongs
to `service_role`.

**Status: closed.**

### H2. Self-granted subscription tier

`public.subscriptions` allows INSERT and UPDATE where `auth.uid() = user_id`.
Ownership is correct, but the same statement chooses the tier, so any account
can grant itself a paid plan. `payment_history` likewise accepts
self-authored INSERTs.

Mobile ignores both tables — the parity document already rules that legacy
subscription data cannot unlock mobile features — so the fix costs nothing on
the mobile path.

Fix: drop the write policies, then revoke the table grants entirely so the
tables leave the PostgREST surface. Rows are preserved.

**Status: closed.**

### H3. Owner tables writable field-by-field

`invitations`, `guests`, `media`, `user_templates` and `guest_uploads` all
allow direct writes under an ownership predicate. That predicate stops
cross-account writes but not privilege escalation *within* a row: the same
UPDATE that changes a title can set `is_public`, `status`, `published_at`,
`view_count`, `rsvp_count`, `slug`, `guest_uploads_count` or `guest_token`.

This is exactly what security criterion 3 in the parity document forbids.

Fix: remove the direct write policies so state transitions and counters move
only through validated functions.

**Status: closed.** Applying this ahead of the RPCs was safe because the web
client is retired and the mobile client still runs with
`EXPO_PUBLIC_ENABLE_BACKEND_WRITES=false`. Writes stay unavailable until
migrations `20260803090000`–`20260803090300` are applied, which is the
intended order anyway.

### H6. Every published invitation readable and enumerable by anon

Found on 2026-08-03 while verifying the new publishable key, after the first
hardening pass had already run.

`public.invitations` kept the policy `Anyone can view published invitations`,
`USING (status = 'published' AND is_public = true)` for role `public`. A single
request returned the complete row:

```
GET /rest/v1/invitations?select=*
```

That is all 25 columns — including the owner's `user_id` and the
`password_hash` column — for invitations belonging to strangers, plus the
ability to list every published invitation in the project.

The first pass dropped the *duplicate* of this policy and kept this one, on the
reasoning that anonymous readers go through `get_public_invitation`. They do,
but the direct table path was still open, so the reasoning did not hold. The
lesson is the one C1 already taught: verify the resulting access, not the
intended access.

Fix: drop the policy. `get_public_invitation` is security definer, returns a
20-key projection with no `user_id` and no `password_hash`, and only resolves
an invitation whose ID the caller already holds. `get_public_rsvp_context` and
`submit_guest_rsvp` read the table as definers and are unaffected.

**Status: closed.** Verified after the change: direct anon read returns 0 rows,
the public invitation RPC and the RSVP path both still work.

### H4. media and guest_uploads readable by anon

`Public media access by QR` on `public.media` is `USING (status = 'active')`
for role `public` — no QR check. It returns `user_id`, `storage_url`,
`owner_message_url`, `qr_code` and expiry for every active row.
`Anyone can view guest uploads by QR` on `public.guest_uploads` is
`USING (true)`.

Fix: drop both. The QR gallery reads go through
`mobile_public_media_context`, which projects only the fields the page needs.

**Status: closed.**

### H5. Public buckets allow listing

`invitation-images` and `templates` are public buckets that additionally carry
broad SELECT policies on `storage.objects`. A public bucket does not need one
to serve `/storage/v1/object/public/...`; the policy only adds the ability to
*enumerate* the bucket, which exposes every uploaded invitation image.

Fix: drop the SELECT policies. Existing image URLs keep working.

**Status: closed.**

## Medium

### M1. Counter functions callable by anon

`increment_invitation_views`, `increment_invitation_count`,
`increment_media_view_count`, `increment_media_scan_count`,
`increment_template_usage` and `inc_guest_uploads_count` are all reachable by
`anon`, with no rate limit. Analytics can be inflated arbitrarily.

Fix: the counter functions are dropped in
`20260803090600_decommission_payments.sql`. The mobile read models increment
their own counters under `mobile_consume_rate_limit`.

**Status: closed.**

### M2. `subscription_notifications` insertable by anyone

The policy is named `Service role can insert notifications` but is granted to
`public` with `WITH CHECK (true)`. `service_role` bypasses RLS and never
needed a policy.

**Status: closed.**

### M3. Twenty functions with a mutable `search_path`

Flagged by the advisor. A SECURITY DEFINER function without a fixed
`search_path` can be redirected to attacker-controlled objects if any schema
in the resolution path is writable. The hardening migration sets
`search_path = public, pg_temp` on all twenty; the decommission migration then
drops seventeen of them.

**Status: closed.**

### M4. Leaked-password protection disabled

Supabase Auth can reject passwords found in HaveIBeenPwned. It is off, and it
cannot simply be turned on. The setting lives at Authentication → Sign In /
Providers → Email, and **it is gated to the Pro plan**. The `Dilcomsys`
organisation is on the free plan, so the toggle is not rendered at all — which
is why it looks missing rather than disabled. It is not a migration setting
either.

Available on the free plan, same screen, and worth setting now:

- Minimum password length 8. `validatePassword` in the mobile client already
  enforces 8, so this only stops the server accepting what the client rejects.
- Required characters: digits plus lower and uppercase letters.

Closing the gap without upgrading means querying HaveIBeenPwned from the client
before `signUp` and `updateUser`, through the k-anonymity range API so only the
first five characters of the SHA-1 digest leave the device. That introduces a
third-party processor and would have to be disclosed in the privacy policy, so
it is a product decision rather than a config change.

**Status: open. Blocked by plan tier.**

## Low

### L1. Duplicate policies

`invitations` has two identical published-read policies and two identical
owner-insert policies; `user_templates` has two full sets. Each duplicate is
evaluated on every row. Cosmetic, but it makes the policy set harder to audit
— which is how C2 stayed invisible.

**Status: closed.**

### L2. Extensions in `public`

`http` and `pg_net` were installed in the `public` schema, which is what made
C1 reachable through PostgREST in the first place.

`http` is dropped. `pg_net` remains: its callable functions live in the `net`
schema, which PostgREST does not expose, so the advisor warning is about where
the extension is registered rather than a reachable surface. It is now unused —
the only caller was the removed cron job — and can be dropped if you want the
warning gone.

**Status: `http` closed; `pg_net` open by choice.**

## What was applied, in order

Applied to production on 2026-08-03 after confirming the legacy web client is
fully retired:

1. `security_hardening_20260803` — sections 1–9
2. `restrict_direct_writes` — H2 and H3
3. `decommission_payments` — drops the billing functions, unschedules both cron
   jobs, revokes the table grants
4. `revoke_public_execute_on_http` — the PUBLIC-grant correction
5. `drop_unused_http_extension` — the actual fix for C1
6. `revoke_public_execute_on_trigger_functions`
7. `close_remaining_direct_write_paths`

Verification after each step used `has_function_privilege`, `pg_policies` and
the Supabase advisors rather than the absence of an error.

Post-state: no `public` function is executable by `anon`; `storage.objects` has
no policies; every `public` table has RLS; the only non-SELECT policies left
are none; `subscriptions`, `payment_history`, `subscription_notifications` and
`invitation_guests` have no grants for `anon` or `authenticated`; there are no
cron jobs.

## Replacing the exposed service role key

The `service_role` key sat in plain text inside a `pg_cron` command string. It
bypasses RLS completely, so it has to stop being valid.

It cannot be *rotated*. `service_role` is a JWT signed by the project's JWT
secret, and Supabase no longer supports rotating that secret on a project —
their guidance is to replace it with a named secret key (`sb_secret_…`), which
can be revoked on its own without touching anything else.

The mobile client is already on the new scheme: it ships
`sb_publishable_…`, not the legacy `anon` key. The only holder of the legacy
key was the Edge Function runtime, and `adminClient()` in
`supabase/functions/_shared/runtime.ts` now prefers `SUPABASE_SECRET_KEYS`
with the legacy variable as a fallback. That makes the change below a
dashboard-only operation — no redeploy, no downtime.

1. **Create the secret key.** Dashboard → Settings → API Keys → *Publishable
   and secret API keys* → create. The `default` key is enough. Supabase starts
   publishing it to the function runtime as `SUPABASE_SECRET_KEYS` immediately,
   and the functions pick it up on their next invocation.
2. **Confirm the functions still work** before revoking anything. Exercise one
   function per authorisation shape: `export-account-data` (`verify_jwt = true`),
   `media-context` (`verify_jwt = false`), and `media-upload-ticket`. Any
   `server_misconfigured` response means the new key is not reaching the
   runtime — stop and fix that first.
3. **Disable the legacy keys.** Dashboard → Settings → API Keys → *Legacy anon,
   service_role API keys* → disable both. This is what actually kills the
   exposed key. `anon` goes with it, which is fine: nothing ships it any more.
4. **Re-run the anonymous leg of the access matrix** in
   `STORE-READINESS-2026-08-04.md` to confirm the publishable key still reaches
   exactly what it should and nothing more.

Do not delete a secret key you are still using — deletion is irreversible.

## Still to do

- Carry out the key replacement above. It is the last item with a live
  consequence.
- Optionally drop the now-unused `pg_net` extension (L2).

Closed on 2026-08-04:

- M4 leaked-password protection is **accepted as open by decision** — gated to
  the Pro plan, and the project is staying on the free plan. The free plan's
  minimum length of 8 is set, and `checkPassword` in the client requires a
  digit and mixed case on top of it.
- `contact-form` deleted from the project; `subscription-expiration-reminder`
  was already undeployed. Both sources moved to
  `archive/retired-edge-functions`.

See `STORE-READINESS-2026-08-04.md` for the owner / non-owner / anonymous
access matrix and what it found.
