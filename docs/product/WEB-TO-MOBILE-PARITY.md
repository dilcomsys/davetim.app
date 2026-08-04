# Web-to-mobile feature parity

## Purpose

This document is the delivery contract for replacing the retired web client with the native Expo application. It covers user-facing behavior, not the legacy implementation. Developer-only routes (`editor-v2-test` and `editor-v2`) are excluded because they are diagnostics rather than product features. The retired Iyzico/3D Secure checkout is also explicitly excluded: mobile payments will use IAP in a later release, while this release can grant only discrete, server-verified rewarded-ad bonuses.

The mobile implementation must remain compatible with existing Supabase records. A row, column, policy, function, bucket, or entitlement is not assumed to exist until it is verified against the scoped Supabase project.

## Status legend

- **Foundation**: a placeholder or partial shell exists, but the user flow is incomplete.
- **Missing**: no mobile implementation exists.
- **Implemented**: the mobile client flow exists and passes local static checks, but backend and/or physical-device acceptance is still pending.
- **Blocked**: implementation depends on verified backend or store-policy information.
- **Complete**: implemented and verified against the acceptance criteria.

## Feature matrix

| Area | Legacy web behavior | Mobile target | Backend dependency | Status |
|---|---|---|---|---|
| Authentication | Email sign-up/sign-in, Google sign-in, forgot/reset password, session persistence | Auth stack, deep-link callback, secure persisted session, sign-out | Supabase Auth providers and redirect URLs | Implemented |
| Home/dashboard | Invitation list, usage and guest summary, recent activity, create/edit/view/delete actions | Task-focused home, invitation cards, aggregate stats, guarded destructive actions | `invitations`, guest statistics RPC/query | Implemented |
| Templates | Browse, categories, search, featured, favorites and saved templates | Searchable/filterable template gallery with saved/favorite state | `templates`, `template_categories`, `user_templates`, storage URLs | Implemented |
| Invitation creation | Start from template or blank draft | Guided create flow that persists a draft before editing | `create_invitation_draft`, slug generation | Implemented |
| Editor | Canvas, text/image/shape/decor elements, properties, layer order, visibility, lock, duplicate, undo/redo | Touch-first editor with equivalent document semantics and explicit save state | Invitation design JSON and asset upload tickets | Implemented |
| Preview/publish | Preview, save, publish, reset, public URL | Native preview, validation, publish/unpublish and share link | Publish RPC, public-read projection, slug | Implemented |
| Export/share | Image/PDF download and social/native sharing | Image/PDF export, share sheet and link copy | Signed/public asset URLs; optional rewarded receipt | Implemented |
| Public invitation | Anonymous invitation page, share/download, view counter | Deep-linkable public route usable without sign-in | Sanitized anonymous read RPC and idempotent/rate-limited view recording | Implemented |
| RSVP | Token-based guest response and status update | Deep-link RSVP form, validation, success/error/retry states | Restricted RSVP context and mutation RPCs | Implemented |
| Guest management | Add/edit/delete guests, bulk import, statistics and spreadsheet export | Guest list, search/filter, CRUD, CSV import/export and response summary | Canonical `guests` model and owner RPCs | Implemented |
| Analytics | Views timeline, RSVP chart, recent activity, top templates, export | Mobile analytics summaries and export where useful | Owner-scoped reads or safe aggregate RPCs | Implemented |
| QR media | Create/manage QR, owner media gallery, upload/delete/download | QR management, gallery upload, moderation and owner gallery | Private bucket plus server-issued upload/delete operations | Implemented |
| Guest media | Anonymous QR page and guest uploads | Public upload route with consent, limits, progress and retry | Server-enforced file/type/quota policy, signed upload | Implemented |
| Profile/account | Profile update, password change, usage, subscription/payment history | Account, security, data export and deletion; legacy payment records remain read-only and are not a mobile purchase path | Auth profile, export and deletion operations | Implemented |
| Legal/support | Legal documents, about and contact | Privacy, terms, KVKK, support/report/account deletion | Published URLs and support destination | Implemented |
| Web payments | Web pricing, Iyzico 3DS checkout, subscription management | Not ported. No web checkout or IAP is shipped in this release. IAP is a later release and will not reuse the legacy schema. | None; archived payment code is never imported by mobile. The legacy tables, functions and cron jobs are decommissioned in `supabase/migrations/20260803090600_decommission_payments.sql` | Excluded by product decision |
| Rewarded bonuses | Not a complete legacy feature; introduced in mobile plan | Optional, disclosed, single-use bonuses with per-platform policy gates and a no-ad fallback | `create-reward-intent` and `admob-ssv` Edge Functions, `consume_reward_receipt`, remote kill switch via `REWARDED_ADS_DISABLED_PLATFORMS` | Implemented |
| Network/resilience | Network status, retry helpers, error boundary | Offline/read-only states, retryable writes, route error boundaries, crash reporting boundary | Observability provider and retry-safe APIs | Implemented |

## Monetisation decision

This release monetises with rewarded ads only. There is no in-app purchase,
no subscription and no web checkout. Every core flow — create, edit, publish,
share, RSVP, guest management, media — works without watching an ad. A reward
unlocks exactly one discrete extra (watermark-free export, HD export, or one
paid-tier template) and is granted only after Google's signed server-side
verification callback, never by the client.

In-app purchase is deferred to a later release and will be built against the
mobile schema, not the retired Iyzico tables.

## Security acceptance criteria

1. The mobile bundle contains only the Supabase URL and publishable key; no service-role key, database password, payment secret, or ad verification secret is embedded.
2. Every user-owned table has RLS enabled and is tested as owner, another authenticated user, and anonymous user.
3. Ad rewards, quotas, upload counts, analytics counters, slugs, and publish state transitions cannot be elevated by a direct client update. Legacy subscription/payment fields are read-only compatibility data and cannot unlock mobile features.
4. Public invitation, RSVP, and guest-media endpoints expose the minimum fields and use unguessable scoped tokens, validation, rate limits, file limits, and idempotency where applicable.
5. The canonical guest table and relations are used consistently; the legacy `guests` / `invitation_guests` split is resolved through a compatibility layer before writes are enabled.
6. Storage buckets default to private. Public delivery uses a deliberately public derivative or short-lived signed URLs; upload MIME type, size, path ownership, and object count are enforced server-side.
7. Destructive account and invitation operations require confirmation and provide a defined retention/deletion behavior.
8. Logs and analytics exclude access tokens, guest tokens, personal form payloads, payment payloads, and signed URLs.

## Release acceptance criteria

- All rows above are either **Complete** or explicitly disabled by a documented platform policy gate without breaking the core invitation/RSVP workflow.
- Existing representative web-created records deserialize and render in mobile tests.
- Authentication, create/edit/publish/share, public invitation, RSVP, guest management, media, export and account deletion pass on physical iOS and Android devices.
- Staging migrations, RLS tests, storage tests, deep links, offline/retry behavior, accessibility, privacy disclosures, store metadata and production builds are verified.
- Production write features remain behind remote flags until staging verification and a reviewed rollout decision.
