# Backend implementation

This document describes what exists in `supabase/`, how it maps to the client,
and what an operator still has to do by hand. The rules it implements are in
[SUPABASE-MOBILE-CONTRACT.md](./SUPABASE-MOBILE-CONTRACT.md); this is the
inventory.

**Applied to production on 2026-08-03.** Every migration in this directory is
live, and all ten Edge Functions are deployed and ACTIVE.

Two things still gate the mobile write path, both deliberate:

- `EXPO_PUBLIC_ENABLE_BACKEND_WRITES` is still `false`. Flip it only after the
  owner / other-user / anonymous matrix and a physical-device pass.
- The rewarded-ad function secrets are not set, so `create-reward-intent`
  fails closed with `rewarded_ads_disabled`. That is the correct state until
  the AdMob units exist.

## Layout

```
supabase/
  config.toml              per-function verify_jwt settings
  inspection/              read-only queries to run before any migration
  migrations/              additive SQL, applied in filename order
  functions/               Deno Edge Functions
    _shared/runtime.ts     CORS, JWT resolution, JSON shapes, URL signing
```

## Division of responsibility

Edge Functions hold the service role key. They therefore contain **no business
invariants**. Ownership, quotas, entitlements, counters and state transitions
all live in security-definer SQL functions, so a bug in a function's HTTP layer
cannot grant a reward, inflate a counter or complete someone else's upload.

An Edge Function exists only where SQL cannot do the work:

| Capability | Why it cannot be SQL |
|---|---|
| Signed storage URLs | Requires the storage API and the service role |
| Object re-inspection after upload | Requires the storage API |
| AdMob signature verification | Requires ECDSA verification and an outbound fetch |
| Recent-session check on deletion | Requires the Auth admin API |

## Migrations

| File | Contents |
|---|---|
| `20260803090000_mobile_support_schema.sql` | `reward_intents`, `reward_receipts`, `upload_tickets`, `account_deletion_requests`, `mobile_rate_limits`; the `storage_path` columns on `media` and `guest_uploads` plus a backfill from the legacy `storage_url` |
| `20260803090100_mobile_read_models.sql` | `get_public_invitation`, `get_public_rsvp_context`, `get_reward_intent_status`, and the service-role media projections |
| `20260803090200_mobile_write_rpcs.sql` | Invitation, guest, RSVP, favourite and media-settings mutations |
| `20260803090300_mobile_reward_and_upload.sql` | `consume_reward_receipt`, reward intent/grant, upload ticket issue/claim/record, account export and deletion |
| `20260803090400_mobile_storage.sql` | Bucket flags, size limits and MIME allowlists |
| `20260803090500_security_hardening.sql` | The remediation for [SECURITY-FINDINGS-2026-08-03.md](./SECURITY-FINDINGS-2026-08-03.md) findings C1–C4, H1, H4, H5, M1–M3 |
| `20260803090550_restrict_direct_writes.sql` | Findings H2 and H3. Split out because it needs the RPCs above to already exist |
| `20260803090600_decommission_payments.sql` | Retires the web billing functions, cron jobs and table grants |

Apply in filename order. `20260803090550` removes the direct write paths that
the earlier RPCs replace, so it must not run before them.

## Client call map

| Client call | Backend object |
|---|---|
| `listInvitations`, `getInvitationForOwner` | `invitations` RLS read |
| `createInvitationDraft` | `create_invitation_draft` |
| `saveInvitationDocument` | `save_invitation_document` |
| `setInvitationPublished` | `set_invitation_publish_state` |
| `manageInvitationLifecycle` | `manage_invitation_lifecycle` |
| `getPublicInvitation` | `get_public_invitation` |
| `listGuests` | `guests` RLS read |
| `getPublicRsvpContext` | `get_public_rsvp_context` |
| `submitRsvp` | `submit_guest_rsvp` |
| `manageGuest` | `manage_invitation_guest` |
| `bulkImportGuests` | `bulk_import_invitation_guests` |
| `listTemplates`, `getTemplateById` | `templates` RLS read |
| `listFavoriteTemplateIds` | `user_templates` RLS read |
| `setTemplateFavorite` | `set_template_favorite` |
| `getOwnerMediaContext`, `getPublicMediaContext` | `media-context` function |
| `uploadOwnerMedia`, `uploadGuestMedia` | `media-upload-ticket` + `complete-media-upload` |
| `setGuestUploadsAllowed` | `update_media_settings` |
| `deleteGuestMedia` | `delete-media-object` |
| `uploadInvitationImage` | `invitation-image-upload-ticket` + `complete-invitation-image-upload` |
| `exportAccountData` | `export-account-data` |
| `requestAccountDeletion` | `request-account-deletion` |
| `requestReward` | `create-reward-intent` + `admob-ssv` + `get_reward_intent_status` |
| `consumeRewardReceipt` | `consume_reward_receipt` |

Two media reads moved from RPC to Edge Function relative to the original
contract table. The response carries short-lived signed URLs, and only a
service role can mint those; the row projection and the scan-counter rate limit
still come from `mobile_public_media_context` in SQL.

## Function secrets

Set with `supabase secrets set`. `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are injected by the platform.

| Name | Used by | Notes |
|---|---|---|
| `REWARDED_ADS_ENABLED` | `create-reward-intent` | `"true"` to issue intents at all |
| `REWARDED_ADS_DISABLED_PLATFORMS` | `create-reward-intent` | Kill switch: `ios`, `android`, `ios,android`, or `all` |
| `ADMOB_REWARDED_IOS_UNIT_ID` | `create-reward-intent`, `admob-ssv` | Also the allowlist the SSV callback checks |
| `ADMOB_REWARDED_ANDROID_UNIT_ID` | same | |

## Deployment

```bash
supabase link --project-ref <ref>
supabase db push                       # migrations, in filename order
supabase functions deploy media-context media-upload-ticket \
  complete-media-upload delete-media-object \
  invitation-image-upload-ticket complete-invitation-image-upload \
  export-account-data request-account-deletion \
  create-reward-intent admob-ssv
```

Functions import the shared helpers through the `@shared/runtime` alias in
`supabase/functions/deno.json` rather than a `../_shared/…` relative path. The
alias resolves against the location of `deno.json`, so the same source works
whether the CLI bundles the whole functions directory or a single function is
uploaded on its own. A relative path only works for the first.

`contact-form` and `subscription-expiration-reminder` are pre-existing
functions that remain deployed. They are excluded from `deno fmt` and
`deno lint` in `supabase/functions/deno.json` so the repository copy stays
byte-identical to what is running.

The AdMob SSV URL to register in the AdMob console is:

```
https://<project-ref>.functions.supabase.co/admob-ssv
```

## Operator tasks not covered by code

- **Account deletion.** `request-account-deletion` records the request and
  unpublishes the account's content. Actual erasure — auth user, storage
  objects, row cascade — is a manual runbook step. `account_deletion_requests`
  is the work queue.
- **Invitation delete.** `manage_invitation_lifecycle('delete')` marks media
  rows deleted but cannot remove storage objects from SQL. A scheduled job
  should sweep `media` and `guest_uploads` rows with `status = 'deleted'` and
  remove their `storage_path` objects.
- **Expired tickets and intents.** `upload_tickets` and `reward_intents`
  accumulate. A daily job should delete expired rows.
- **Leaked-password protection.** Dashboard setting; see
  [SECURITY-FINDINGS-2026-08-03.md](./SECURITY-FINDINGS-2026-08-03.md) M4.

## Known limitations

- **View counting is not per-device.** SQL cannot see the caller IP, so
  `get_public_invitation` caps increments at 60 per invitation per minute
  rather than deduplicating per visitor. It bounds inflation; it is not a
  unique-visitor metric. Moving the counter into an Edge Function would fix
  this and is the natural next step if the number needs to be trustworthy.
- **Invitation quota is a flat constant.** `create_invitation_draft` allows 25
  non-archived invitations per account. It is an abuse guard, not a
  monetisation gate, and lives as a constant in the function body.
- **`invitation-images` stays a public bucket.** Published invitations already
  reference its objects by public URL. New objects get random paths with no
  user identifier, and bucket listing is removed, but the objects themselves
  remain publicly fetchable by URL.
