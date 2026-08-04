# Rewarded ads plan

## Decision

Version 1 has no in-app purchases. Core invitation creation, sharing, and RSVP tracking must remain usable without watching ads. Rewarded ads are an optional path for discrete, single-use bonuses—not an ad wall.

The retired web Iyzico/3D Secure checkout and subscription purchase flow will not be ported. IAP may be designed for a later release, but no purchase entry point, hidden web checkout, or client-side subscription upgrade is part of the current mobile application.

Live ad integration is intentionally deferred. The code currently exposes a provider-neutral `RewardedAdGateway` whose development implementation never grants a reward.

## Candidate rewards

| Reward | Scope | Expiry | Notes |
|---|---|---:|---|
| Watermark-free export | One invitation export | 24 hours or consumption | Exact reward displayed before opt-in |
| Premium template trial | One invitation using one template | Bound to invitation | Does not unlock the full catalog |
| HD export | One export | 24 hours or consumption | Avoids an ongoing server cost |

Do not initially offer unlimited storage, permanent premium status, long media retention, or an unlimited template library for a single ad. The value exchange would be unclear and server costs could exceed ad revenue.

## Experience rules

1. Never show banner ads in the editor or public invitation.
2. Never show an interstitial at launch, during form entry, before RSVP submission, or during export processing.
3. Show a disclosure sheet before every rewarded ad: action, exact reward, scope, expiry, and a clear “Not now” action.
4. The user must explicitly opt in each time. Do not auto-chain ads.
5. Grant the promised reward even if the client loses connectivity after completion; reconcile with server-side verification.
6. Frequency cap: at most three completed rewarded ads per user per rolling 24 hours at launch. Adjust only from measured retention and complaint data.
7. Provide “Why am I seeing this?”, privacy choices, and inappropriate-ad reporting.
8. Use test ad unit IDs in development and preview builds.

Google requires a clear disclosure of the action and reward before each rewarded ad and an affirmative opt-in. See [AdMob rewarded-ad policy](https://support.google.com/admob/answer/7313578). Google also offers [server-side verification](https://support.google.com/admob/answer/9603226) as an additional validation layer.

## Platform policy gate

Apple’s current guidelines require IAP for paid digital feature unlocks and also state that users may not be required to engage in advertising or marketing to unlock app functionality. This creates review risk for export/template feature gates even when the ad is optional. See [App Review Guidelines 3.1.1 and 3.1.4](https://developer.apple.com/app-store/review/guidelines/).

Therefore:

- Android may pilot the candidate rewards after policy and closed-test validation.
- iOS rewarded feature gates remain behind a server kill switch until App Review positioning is validated.
- If Apple rejects the model, iOS v1 keeps a fixed free quota and disables rewarded feature unlocks; no hidden web purchase path is added.
- The same app version must remain useful when every ad placement is remotely disabled.

## Privacy and audience

- Collect/update consent before requesting ads and only request ads when the SDK reports that ads may be requested.
- Offer a persistent privacy-options entry point when required.
- Default to the least invasive ad mode until consent and regional eligibility are known.
- Decide and document whether the app is directed to children. Do not publish to the Kids category with third-party ads without a separate compliance review.
- Complete App Store privacy labels and Google Play Data safety declarations from the actual SDK data flow, not assumptions.

Google’s [UMP setup guidance](https://developers.google.com/admob/android/privacy) requires refreshing consent information and checking whether ads can be requested. Apple requires ATT permission for cross-app tracking and makes the developer responsible for third-party SDK behavior; see [App Review privacy guidance](https://developer.apple.com/app-store/review/guidelines/).

## Server-side entitlement design (planned, not applied)

### `rewarded_ad_events`

- `id uuid primary key`
- `provider text not null`
- `provider_transaction_id text unique not null`
- `user_id uuid not null references auth.users`
- `feature_key text not null`
- `invitation_id uuid null`
- `status text not null` (`received`, `verified`, `rejected`)
- `reward_amount integer not null default 1`
- `custom_data jsonb not null default '{}'`
- `occurred_at timestamptz not null`
- `created_at timestamptz not null default now()`

### `feature_entitlements`

- `id uuid primary key`
- `user_id uuid not null references auth.users`
- `feature_key text not null`
- `invitation_id uuid null`
- `source_event_id uuid unique not null references rewarded_ad_events`
- `granted_at timestamptz not null default now()`
- `expires_at timestamptz null`
- `consumed_at timestamptz null`

Only a server-side function may insert verified events or entitlements. Clients may read their own entitlements and call a security-definer consumption function with strict ownership checks. Provider transaction IDs enforce idempotency.

## Metrics and stop conditions

Track opt-in rate, completion rate, verification failures, reward-delivery latency, ad-related exits, support complaints, and day-1/day-7 retention. Disable the feature remotely if reward mismatch exceeds 0.5%, crash-free sessions decline, or either store raises a policy concern.
