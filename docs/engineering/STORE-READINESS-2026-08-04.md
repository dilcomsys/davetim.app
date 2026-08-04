# Store readiness pass — 2026-08-04

Covers the access matrix that Phase A of the release plan gates the write flag
on, plus a review of the client for the things a store submission fails on:
unreachable support paths, screens that cannot be scrolled, missing ad
configuration, and legal text that disclaims itself.

## The access matrix

Run against production `lwowqdxysoqrwoylhouy` by setting `request.jwt.claims`
and the Postgres role inside a transaction that always rolls back. Two real
accounts were used: **A** owns six invitations, **B** owns three.

### Anonymous

| Check | Result |
|---|---|
| `select` on `invitations`, `guests`, `media`, `guest_uploads`, `user_templates` | 0 rows each |
| `select` on `templates` | 25 rows — the gallery needs this |
| `insert` into `invitations` | blocked by RLS |
| `update` on `guests` | 0 rows changed |
| `update` on `templates` | 0 rows changed |

### Signed in as a non-owner

| Check | Result |
|---|---|
| `select` on `invitations` | 3 rows, all B's; 0 of A's |
| `select` on `guests` | 0 rows |
| `save_invitation_document` on A's invitation | `invitation_not_found` |
| `set_invitation_publish_state` on A's | `invitation_not_found` |
| `manage_invitation_lifecycle(delete)` on A's | `invitation_not_found` |
| `manage_invitation_guest` on A's | `invitation_not_found` |
| `mobile_is_invitation_owner` on A's | false |
| direct `update` on A's invitation | 0 rows changed |
| `insert`/`update` on `templates` | blocked by RLS |

### Signed in as the owner

| Check | Result |
|---|---|
| `select` on own invitations | 6 rows |
| `save_invitation_document` | OK |
| `create_invitation_draft` | OK |
| `set_template_favorite` | OK |
| `manage_invitation_guest` with a name only | **failed** — see below |

**Every deny leg passes.** The one failure is on the owner's own happy path and
is fixed by a migration below.

## Found by the matrix

### Adding a guest by name only was impossible

`public.guests` carried `email_or_phone_required`, a CHECK from the retired web
product where an invitation was delivered by e-mail. The mobile product
delivers a per-guest RSVP link instead, and `manage_invitation_guest` reflects
that: it raises `guest_name_required` and nothing else, and writes NULL for a
blank address. The constraint therefore rejected the app's most ordinary
action, and the failure surfaced as a raw Postgres string because a constraint
name is not in the client's server-message map. CSV import failed identically
for any file without an e-mail column, which the importer explicitly supports.

Migration: `20260804090000_guest_contact_optional.sql`. **Not yet applied.**

### RLS policies re-evaluate `auth.uid()` per row

Eleven policies use a bare `auth.uid()`, so Postgres re-runs it for every row
scanned instead of once per query. Same access, more work, worse as the tables
grow. Also `public.media` carries two identical indexes on `qr_code`.

Migration: `20260804090100_rls_initplan_and_duplicate_index.sql`. **Not yet
applied.**

## Found in the client

### Support and ad reporting silently did nothing

`Linking.openURL('mailto:…')` with the promise discarded. A device with no mail
account rejects the open, and the rejection went nowhere — the two rows a store
reviewer uses to reach support and to report an ad did nothing at all when
tapped. Both now check `canOpenURL`, catch the failure, copy the address to the
clipboard and say so; the address is also printed on the row.

### The two public screens could not be scrolled

`i/[invitationId]` — the page every guest opens from a shared link — and
`rsvp/[guestToken]` were fixed `View`s. Measured on a 390×700 viewport the
invitation page is 1043pt tall, so 343pt including the event details, the share
buttons and the footer were unreachable. The RSVP form put its note field and
its submit button off-screen before the keyboard was even up. Both now scroll
inside a safe area, and RSVP avoids the keyboard.

### Terms and privacy were unreachable before sign-up

The sign-up screen said "by continuing you accept the terms and the privacy
policy" as plain text. The only route to those documents was the profile tab,
behind the account being created. Both are links now.

### Rewarded unit IDs were not validated at build time

The native AdMob App IDs failed the build when missing; the rewarded *unit* IDs
were read only when a user tapped to watch an ad. A release could be built
without them and would look healthy until someone tried to claim a reward. Both
halves now fail at config time.

### SKAdNetwork identifiers were missing

The AdMob config plugin only writes `SKAdNetworkItems` when passed
`skAdNetworkItems`, which was not set. Without them iOS sends no install
postback for those buyers. Google's 50 published identifiers are now declared.
No `NSUserTrackingUsageDescription` is declared, deliberately: the gateway
requests non-personalised ads only and never touches the IDFA.

### Lists never refetched

Tab screens stay mounted, so a list was fetched once per app launch. Creating
an invitation and returning to the list left the row missing until a restart;
publishing, archiving and deleting had the same problem. Screens now refresh on
focus and support pull-to-refresh.

### Other client fixes

- A calendar date was parsed as midnight UTC, so an event on the 12th displayed
  as the 11th anywhere west of Greenwich.
- The invitations list printed the raw stored `2026-09-12` while every other
  surface wrote the date out.
- The invitations list had no filtering; it now filters by status with counts,
  and searches title and venue.
- The privacy policy, terms and KVKK screens ended with an internal note saying
  the text still needed legal review before release — shown to users and to
  store reviewers.
- Password rules were length-only. They now match the composition rules
  available on the free Supabase plan, and name the rule that failed rather
  than restating all of them.

## Closed later the same day

- Both migrations applied. Verified against the live catalogue: the constraint
  is gone, all eleven policies now read `( SELECT auth.uid() AS uid)`, and
  `idx_media_qr_code` is dropped with `media_qr_code_idx` kept. The performance
  advisor's eleven `auth_rls_initplan` warnings and the duplicate-index warning
  are all gone; only INFO-level unused-index notes remain, which is what a
  pre-launch database looks like.
- The owner leg was re-run: adding a guest by name only succeeds, and a bulk
  import with null e-mail and phone inserts both rows. (A first retest reported
  a CSV failure — that was the test sending `fullName` where the RPC reads
  `full_name`, not a product defect.)
- `EXPO_PUBLIC_ENABLE_BACKEND_WRITES` is `true`.
- Minimum password length is set to 8 on the project.
- `contact-form` deleted from the project. Ten functions remain, every one of
  them called by the mobile client. Its source and the already-dead
  `subscription-expiration-reminder` moved to `archive/retired-edge-functions`,
  so the Deno checks in CI now cover only code that runs and no exclusions are
  needed.

## Still open

- Rotate the service role key that was embedded in the removed cron job.
- M4 leaked-password protection stays open by decision: it is gated to the Pro
  plan and the project is staying on the free plan. The client enforces length,
  a digit and mixed case, which is the strongest floor available without it.
- Optionally drop the unused `pg_net` extension.
- Replay, quota and tamper cases for the write RPCs.
- Phase B native acceptance on physical devices is untouched by this pass.
