# Pre-release check — 2026-08-04

Second pass, after analytics, prompts, notifications and Firebase went in.
Ordered by what stops a release.

## Blockers

### 1. davetim.app does not serve this product

The domain answers with a website-builder placeholder (`server: hcdn`, page
title "Home"). The landing app in `apps/landing` is not deployed there, and the
mobile web export is not deployed anywhere.

Everything below is a consequence of that one fact:

| Path | Now | Needed by |
|---|---|---|
| `/i/<id>` | 404 | every shared invitation link the app produces |
| `/rsvp/<token>` | 404 | every guest RSVP link |
| `/media/<qr>` | 404 | every QR gallery |
| `/privacy` | 404 | App Store Connect, mandatory field |
| `/terms` | 404 | store listing |
| `/support` | 404 | App Store Connect, mandatory field |
| `/account-deletion` | 404 | App Store account-deletion policy |
| `/app-ads.txt` | 404 | AdMob inventory authorisation |

`EXPO_PUBLIC_PUBLIC_APP_URL=https://davetim.app`, so the share and RSVP flows —
the core loop of the product — currently hand out dead links. This is a
functional failure before it is a store problem.

Two apps have to share the origin, because they own different paths:

- `apps/landing` (Vite) serves `/`, `/privacy`, `/terms`, `/support`,
  `/account-deletion` and the static `app-ads.txt`.
- `apps/mobile`'s Expo **web export** serves `/i/*`, `/rsvp/*`, `/media/*`.
  These routes exist only there; the landing app has no such pages.

Whatever host is chosen, the mobile export's `_redirects`-equivalent must not
swallow the landing routes and vice versa. Verify all eight paths above return
200 before submitting.

### 2. Google sign-in without Sign in with Apple

App Store Review Guideline 4.8: an app offering a third-party login must also
offer a privacy-focused equivalent. The sign-in screen offered Google alone.

**Resolved by removing both social logins for this release** (product decision:
they return in a later version). E-mail and password is now the only sign-in, so
4.8 does not apply at all.

`signInWithGoogle` is still wired in `auth-provider` but reachable from no
screen, and carries a comment saying why. Re-surfacing it on iOS without adding
Apple sign-in first is a rejection.

### 3. Server-side rewarded ads were switched off — **resolved**

`REWARDED_ADS_ENABLED` and `ADMOB_REWARDED_IOS_UNIT_ID` were set on 2026-08-04.
Re-probed afterwards: an anonymous call to `create-reward-intent` now answers
`401 not_authenticated` rather than `403 rewarded_ads_disabled`, which is the
correct response and proves the master switch passed. `ADMOB_REWARDED_ANDROID_UNIT_ID`
is still unset, which is fine while Android is unpublished — intent creation
would 403 on that platform.

Original finding: `create-reward-intent` answered `403 rewarded_ads_disabled`. The client has ads
enabled and all four AdMob IDs set, so the app offers "watch an ad for an HD
export" and the server refuses the intent — the user gets an error at the one
moment they agreed to watch an ad.

The Edge Function reads these, none of which are set:

| Secret | Purpose |
|---|---|
| `REWARDED_ADS_ENABLED` | master switch, fails closed |
| `ADMOB_REWARDED_IOS_UNIT_ID` | validates the `ad_unit` on the SSV callback |
| `ADMOB_REWARDED_ANDROID_UNIT_ID` | same, Android |
| `REWARDED_ADS_DISABLED_PLATFORMS` | optional per-platform kill switch |

Set them in Supabase → Edge Functions → Secrets. The unit IDs must match
`.env` exactly. Until then, either set the secrets or turn
`EXPO_PUBLIC_ENABLE_REWARDED_ADS` back to `false` so the app stops offering
something that cannot work.

## Fixed in this pass

### Trigger functions were executable by anon and authenticated

`mobile_on_guest_rsvp_change`, `mobile_on_guest_upload` and
`mobile_wake_notification_dispatcher` were created without revoking the default
PUBLIC grant. PostgREST does not publish functions returning `trigger`, so a
direct call answers 404 — but that is PostgREST's behaviour, not an
authorisation decision, and revoking these is the standard this project already
set in the 2026-08-03 pass. They were missed when notifications were added.

Revoked and verified with `has_function_privilege`, then verified the triggers
still fire: an anonymous RSVP through `submit_guest_rsvp` still queues its
notification.

### iOS privacy manifest declared no collected data

`PrivacyInfo.xcprivacy` carried the required-reason API entries Expo generates
but an empty `NSPrivacyCollectedDataTypes`, while the app now collects analytics
events, a user ID and a push token. Apple cross-references this against the
App Store Connect privacy answers, and a mismatch is a documented rejection.

`ios.privacyManifests` in `app.json` now declares eight data types: e-mail,
name, user ID, device ID, photos/videos, other user content, product
interaction and advertising data. `NSPrivacyTracking` stays false — the app
requests non-personalised ads only and never touches the IDFA.

When filling the App Store Connect privacy questionnaire, answer it to match
this list.

### app-ads.txt was missing

Added at `apps/landing/public/app-ads.txt`, verified present in `dist/` after a
build. Publisher ID `pub-6150267472645410`, taken from the iOS AdMob app ID. It
only takes effect once the domain actually serves it — see blocker 1.

## Verified healthy

- UMP consent is gathered before any ad request, and `canRequestAds` is checked
  rather than assumed.
- `requestNonPersonalizedAdsOnly` is set, no ATT prompt is declared, and
  SKAdNetwork carries Google's 50 published identifiers.
- The build fails closed when ads are enabled without all four AdMob IDs.
- Supabase security advisors: no Critical or High findings. The remaining
  entries are the intended SECURITY DEFINER write path, service-role-only
  tables with RLS and no policy, and `pg_net` living in `public`.
- Account deletion, data export, and the three legal documents are in the app.
- `eas.json` production uses `autoIncrement`, so build numbers are handled.
- Typecheck, lint, 80 tests, web export and Deno checks all pass.

## Deferred by decision

### Reward bookkeeping is never pruned

`reward_intents` and `reward_receipts` grow without bound: nothing deletes an
expired-but-still-pending intent or a receipt that was never consumed, there are
no cron jobs in this project, and `mobile_create_reward_intent` does not prune
as it goes.

Not a blocker and not a leak — both tables are empty today, RLS restricts reads
to the owner, and neither is on a hot path. **Deferred until there is real ad
traffic to size it against.**

When it is worth doing, the cheap version needs no scheduler: have
`mobile_create_reward_intent` delete the calling user's own expired rows on the
way in. That keeps the work proportional to use, touches only rows the caller
already owns, and adds no new privileged surface. Revisit once the ad funnel has
numbers.

## TestFlight preparation — 2026-08-05

Verified by generating the native project locally (`expo prebuild`) rather than
by starting an EAS build and reading the failure.

### Fixed

- **The app icon was the stock Expo mark**, which the release plan already
  listed as a blocker. Replaced with a 1024×1024 icon drawn from the brand's own
  `SealMark` — the double-ringed D monogram with its gold dots, İznik palette.
  Opaque RGB, no alpha: App Store Connect rejects an icon with an alpha channel.
  The splash was the stock mark too, and now uses the same seal.
- **A production build would have shipped with no Supabase configuration.**
  `.env` is gitignored and the `production` profile had no `env` block, so
  `EXPO_PUBLIC_SUPABASE_URL` and the publishable key would have been undefined —
  the app would have opened straight into its "unconfigured" state with no way
  to sign in. Added to `eas.json`. Every value there already ships inside the
  binary, so none of it is a new disclosure; nothing matching `sb_secret_` or
  `service_role` is present, and that was checked rather than assumed.
- **`ITSAppUsesNonExemptEncryption` was missing**, so App Store Connect would
  ask the export-compliance question on every upload and hold the build. The app
  uses only HTTPS, which is exempt.
- **The privacy manifest lost its required-reason API declarations.** Declaring
  `ios.privacyManifests` *replaces* what the prebuild generates instead of
  merging, so the four entries Expo emits (UserDefaults, SystemBootTime,
  DiskSpace, FileTimestamp) disappeared when the collected-data types were
  added. App Store Connect rejects that upload with ITMS-91053. Restated in
  `app.json` and re-verified: 4 accessed APIs, 8 collected types.
- **EAS project linked**: `@dilcomsysdev/davetim`,
  `48db340a-f76e-40a8-8b0f-27acebe69fcd`. This also unblocks push tokens, which
  need `extra.eas.projectId`.

### iOS linkage: neither mode works on its own

Found by running `pod install` locally rather than by watching an EAS build
fail. Both linkage settings are refused outright:

| `useFrameworks` | Why it fails |
|---|---|
| `static` | `react-native-firebase` resolves firebase-ios-sdk through SPM, whose Swift Package ships only dynamic products. Each Firebase pod embeds its own copy → duplicate symbols. |
| `dynamic` | Google's `UserMessagingPlatform`, pulled in by the ads SDK for the consent flow, ships a **static** xcframework, and CocoaPods will not place a static binary inside a dynamic-framework target. |

Resolved with `plugins/with-rnfirebase-no-spm.js`, which writes
`$RNFirebaseDisableSPM = true` into the Podfile before any target block so
Firebase resolves through CocoaPods, and keeps `useFrameworks: static` for the
ads SDK. The `static` setting was originally added on the usual advice for
react-native-firebase; that advice predates the SPM migration.

**Do not pipe `pod install` through `tail`.** The exit code then comes from
`tail`, and a failed install reads as success — that happened here, and the
giveaway was a missing `Podfile.lock` rather than the status code.

### Confirmed in the generated project

`GADApplicationIdentifier` is the real iOS AdMob app ID, `SKAdNetworkItems` has
50 entries, the photo-library purpose string is present, there is no
`NSUserTrackingUsageDescription` (correct for non-personalised ads), and
`aps-environment` is in the entitlements for push.

## Still open, not blocking

- Leaked-password protection stays off by decision (Pro plan). Minimum length 8
  is set; the client also requires a digit and mixed case.
- The service role key from the removed cron job is still unrotated. The
  replacement procedure is in `SECURITY-FINDINGS-2026-08-03.md`.
- `extra.eas.projectId` is unset, so push tokens cannot be issued: server push
  reaches nobody while local event reminders keep working. Run `eas init`.
- Android is not being published yet, so its AdMob app ID is still Google's
  test value.
- Phase B device acceptance has not been done.
