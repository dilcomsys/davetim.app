# Supabase mobile contract

This is the client/backend boundary for the Expo application. It is an implementation checklist, not proof that a database object exists. Every object must be inspected through the project-scoped Supabase MCP before a migration is applied or `EXPO_PUBLIC_ENABLE_BACKEND_WRITES` is enabled.

## Trust boundary

- The mobile bundle contains only the project URL and publishable key.
- `auth.uid()` is the only accepted owner identity. No RPC or Edge Function trusts a client-supplied user ID.
- Tables that affect quotas, publication, upload counts, rewarded rights, or deletion are not directly writable by mobile roles.
- Every `security definer` function has an explicit `search_path`, validates the caller and object ownership, and grants execution only to the intended `anon` or `authenticated` role.
- Anonymous responses are constructed JSON projections. They never return table rows with `select *`.
- Rate limits and idempotency live on the server. Client feature flags are rollout controls, never authorization.

## Read models

| Client operation | Backend object | Role | Required behavior |
|---|---|---|---|
| Browse templates | `templates` RLS read | anon/authenticated | Active rows and explicit public columns only |
| Owner invitations | `invitations` RLS read | authenticated | `user_id = auth.uid()` |
| Owner guests | `guests` RLS read | authenticated | Owner verified through parent invitation |
| Favorite IDs | `user_templates` RLS read | authenticated | `user_id = auth.uid()` |
| Public invitation | `get_public_invitation(p_invitation_id)` | anon/authenticated | Published/public projection, atomic rate-limited view count |
| Public RSVP | `get_public_rsvp_context(p_guest_token)` | anon/authenticated | Token-scoped guest projection without email, phone, token or owner ID |
| Owner QR gallery | `media-context` Edge Function, scope `owner` | authenticated | Owner projection plus short-lived signed URLs |
| Public QR gallery | `media-context` Edge Function, scope `public` | anon/authenticated | Active/non-expired projection, short-lived signed URLs and rate-limited counters |
| Reward status | `get_reward_intent_status(p_intent_id)` | authenticated | Only caller-owned intent; status and receipt ID only |

## Mutations

| RPC | Role | Invariants |
|---|---|---|
| `create_invitation_draft(p_document, p_template_id, p_reward_receipt_id)` | authenticated | Uses `auth.uid()`, validates JSON size/schema, template tier, optional single-use receipt, quota and unique slug in one transaction |
| `save_invitation_document(p_invitation_id, p_document)` | authenticated | Owner only; whitelisted fields; JSON/string/URL limits |
| `set_invitation_publish_state(p_invitation_id, p_publish)` | authenticated | Owner only; validates required event fields; atomically sets status/public/published timestamp |
| `manage_invitation_lifecycle(p_invitation_id, p_action)` | authenticated | Owner only; allowlisted action; duplicate resets counters/status; delete follows documented cascade/storage cleanup workflow |
| `manage_invitation_guest(...)` | authenticated | Parent owner only; create/update/delete allowlist; normalized fields and length limits |
| `bulk_import_invitation_guests(p_invitation_id, p_guests)` | authenticated | Parent owner; 1–500 rows; JSON shape/length validation; one transaction |
| `submit_guest_rsvp(...)` | anon/authenticated | Unguessable token; status allowlist; companion range; rate limit; idempotent update |
| `set_template_favorite(p_template_id, p_favorite)` | authenticated | Upsert/delete only caller row; active template required |
| `update_media_settings(p_media_id, p_allow_guest_upload)` | authenticated | Media owner only; cannot alter counts, code, expiry or storage path |
| `consume_reward_receipt(p_receipt_id, p_feature, p_invitation_id)` | authenticated | Verified, caller-owned, unexpired, matching feature/context and unused; atomic consume |

## Edge Functions

| Function | Authentication | Contract |
|---|---|---|
| `create-reward-intent` | JWT required | Feature/context allowlist, remote platform kill switch, short-lived nonce/custom data; no grant |
| AdMob SSV callback | Google signature | Preserve exact signed query, fetch/cache Google public keys, ECDSA verify, timestamp window, expected unit/reward, unique `transaction_id`, bound intent/user; idempotently create one receipt |
| `media-upload-ticket` | Owner JWT or anonymous QR scope | Server MIME/size/quota/path validation; guest rate limit and consent receipt; short-lived signed upload only |
| `complete-media-upload` | Ticket-bound | Re-inspect object metadata, atomically create/update row and counts, consume ticket; delete invalid/orphaned objects |
| `delete-media-object` | JWT required | Owner relation check, delete storage and row consistently; idempotent retry |
| `invitation-image-upload-ticket` | JWT required | Image MIME/10 MB limit, user-owned path, existing invitation ownership when supplied |
| `complete-invitation-image-upload` | Ticket-bound | Validate object then return deliberately public derivative URL or signed delivery contract |
| `export-account-data` | JWT required | Caller data only; omit internal tokens, signed URLs, security logs and secrets |
| `request-account-deletion` | JWT + recent session policy | Idempotent request, cascade/retention workflow, storage cleanup and audit-safe status |

## Canonical tables

- `invitations`: owner, template, event fields, design JSON, publication state and counters.
- `guests`: the only writable guest table. Legacy `invitation_guests` is migrated or exposed read-only through a compatibility view; mobile never writes both.
- `templates`, `template_categories`, `user_templates`.
- `media`, `guest_uploads`: paths only; permanent signed URLs are never stored.
- `reward_intents`, `reward_receipts`: nonce/status, platform, feature/context, expiry, AdMob transaction uniqueness and one-time consumption.
- `upload_tickets`: hashed/bound ticket identity, scope, expected metadata, expiry and completion state.
- `account_deletion_requests`: caller, status and lifecycle timestamps without copying user content.

All user-owned tables require RLS and indexes supporting their policy predicates. Counter columns are changed only by the server contracts above.

## Storage

- `qr-media` is private. Object paths are server-generated and scoped by owner or upload ticket.
- Original invitation images are private by default. If public invitations require cacheable delivery, publish a deliberate derivative bucket/path that contains no user identifiers.
- MIME is checked from both declared metadata and object/file signature where supported. Limits are 10 MB for images and 100 MB for videos.
- Signed upload/download URLs are short-lived and never logged.

## Verification matrix

For every table, RPC, function and bucket test these identities separately: owner, another authenticated user and anonymous. Add replay tests for RSVP, reward transaction, upload completion, counters and deletion. Writes stay disabled until the MCP inspection, migration diff, RLS tests and physical-device smoke tests all pass.
