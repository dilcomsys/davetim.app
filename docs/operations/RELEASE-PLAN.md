# Release plan

## Current release state

- Legacy web deployment workflow: archived and inactive; replaced by `.github/workflows/ci.yml`
- Landing: production build succeeds locally; not deployed by this repository
- Mobile: parity client implemented; typecheck, tests, lint, landing build and static web export pass locally
- Mobile backend: all migrations applied and ten Edge Functions deployed. The access matrix passed on 2026-08-04 and backend writes are enabled in the client; the remaining gate is device testing
- Production database: security hardening applied 2026-08-03, all Critical and High findings closed. Two further migrations applied 2026-08-04; the security and performance advisors are down to INFO-level unused-index notes
- Native runtime: not yet accepted on physical iOS and Android devices
- Live ads: disabled

## Phase A — backend verification and staging

- ~~Connect the scoped Supabase MCP and confirm the target project before any write.~~ Done 2026-08-03; project `lwowqdxysoqrwoylhouy`.
- ~~Inventory tables, functions, policies, Auth settings, buckets and deployed Edge Functions through reviewed read-only queries.~~ Done; results in `docs/engineering/SECURITY-FINDINGS-2026-08-03.md`.
- ~~Apply the security hardening migration.~~ Done 2026-08-03.
- Create a separate staging Supabase project and test users.
- ~~Apply migrations `20260803090000` through `20260803090400`.~~ Done 2026-08-03 on production.
- ~~Test owner, other-user and anonymous access.~~ Done 2026-08-04 against production; results in `docs/engineering/STORE-READINESS-2026-08-04.md`. Every deny leg passes. Replay, quota and tamper cases are still outstanding.
- ~~Deploy the Edge Functions.~~ Done 2026-08-03. Their secrets are still unset, so `create-reward-intent` fails closed; set them before Phase C.
- ~~Apply `20260804090000_guest_contact_optional.sql` and `20260804090100_rls_initplan_and_duplicate_index.sql`.~~ Done 2026-08-04 and verified against the live catalogue.
- ~~Flip `EXPO_PUBLIC_ENABLE_BACKEND_WRITES` to `true`.~~ Done 2026-08-04.
- ~~Delete the deployed `contact-form` Edge Function.~~ Done 2026-08-04. Ten functions remain, all called by the mobile client.
- Rotate the service role key that was embedded in the removed cron job. **This is the last open item in Phase A.**

## Phase B — native acceptance

- Build development clients because the ads module does not run in Expo Go.
- Test on one physical iOS device and one physical Android device.
- Run migration compatibility tests with copies of representative legacy records.
- Exercise authentication, create/edit/publish/share, public invitation, RSVP, guest/media flows, export and account deletion end to end.
- Verify deep links, offline/retry states, accessibility, image/PDF output and all permission prompts.
- Publish the landing independently with disabled store buttons.
- Publish and validate support, privacy, terms, KVKK and account-deletion URLs.

## Phase C — closed distribution and ads

- Use TestFlight and Google Play closed testing.
- Provide reviewer/test accounts and sample invitation links.
- Integrate test ads only after consent and platform-policy gates pass.
- Validate server-side ad callbacks with replay and tamper tests.
- Keep every core invitation and RSVP flow usable without watching an ad.

## Phase D — store launch

- Replace landing environment URLs with real App Store and Play Store listings.
- Enable production ad units gradually using a remote kill switch.
- Monitor crash-free sessions, auth failures, write errors, RSVP success, and reward reconciliation.

## Open blockers as of 2026-08-04

Detail in `docs/operations/PRE-RELEASE-CHECK-2026-08-04.md`.

1. **davetim.app still serves a website-builder placeholder.** Every shared
   invitation link, every RSVP link, every QR gallery, both legal pages, the
   support page and `app-ads.txt` return 404 against the live domain. The
   combined site is built and verified locally — `npm run build:web` produces
   `dist-web/` and all eight paths answer correctly — so what remains is
   creating the Cloudflare Pages project and repointing DNS. Steps in
   `docs/operations/CLOUDFLARE-PAGES-DEPLOY.md`.
2. ~~**Server-side rewarded ads are off.**~~ Resolved 2026-08-04:
   `REWARDED_ADS_ENABLED` and `ADMOB_REWARDED_IOS_UNIT_ID` are set, and
   `create-reward-intent` now answers `401 not_authenticated` to an anonymous
   caller instead of `403 rewarded_ads_disabled`. `ADMOB_REWARDED_ANDROID_UNIT_ID`
   stays unset while Android is unpublished.

## Release blockers

- Any unapplied item in `docs/engineering/SECURITY-FINDINGS-2026-08-03.md` rated Critical or High
- Any unreviewed database migration
- Supabase project identity or live schema not confirmed through the scoped MCP
- Missing RLS coverage
- Client-side-only reward grants
- Placeholder Expo application icons or unconfirmed bundle identifiers
- Placeholder screens, broken URLs, or unavailable backend services
- Missing privacy/support/account-deletion paths
- Rewarded-feature model not cleared for the target platform

## Dependency note

The latest local audit found zero vulnerabilities in the landing app and 13 moderate findings in the Expo SDK 57 dependency graph. The reported chain is inherited primarily through Expo tooling and native build dependencies; npm proposes incompatible/unsafe package downgrades rather than a reviewed SDK 57 fix. Do not run `npm audit fix --force`. Recheck Expo release notes and `npm audit` before every native release, and update only through an SDK-compatible Expo upgrade.
