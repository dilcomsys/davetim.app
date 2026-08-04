# Architecture

## Repository layout

```text
apps/
  mobile/                 Expo + React Native application
  landing/                React + Vite download landing page
archive/
  web-legacy/             Retired React web source and deployment files
database/                 Existing SQL assets; no automatic execution
docs/                     Current documentation and legacy document archive
supabase/functions/       Existing Supabase Edge Functions
```

## Mobile stack

- Expo SDK 57
- React Native 0.86 and React 19
- Expo Router with typed routes
- TypeScript strict mode
- Supabase JavaScript client
- SQLite-backed local storage for persisted auth sessions

Expo’s current SDK reference lists SDK 57 with React Native 0.86 and React 19.2.3. The [Expo Supabase guide](https://docs.expo.dev/guides/using-supabase/) uses a publishable key with RLS and local session storage; no service-role key belongs in the application.

## Boundaries

### UI

Routes live under `apps/mobile/src/app`. Shared presentational components live under `src/components`, and design values under `src/theme`.

### Backend client

`src/lib/supabase.ts` is the only client construction point. It returns `null` until both public environment variables exist, preventing accidental live access during UI development.

### Ads

`src/features/ads/rewarded-feature.ts` defines product-level reward keys and a provider-neutral gateway. The development adapter is disabled. A later AdMob adapter must not grant server-backed value from a client callback alone.

### Legacy web

The old web code is a read-only reference in `archive/web-legacy/frontend`. Do not import from it at runtime. Reimplement and test domain behavior in the mobile app, then extract shared pure TypeScript only when both active apps need it.

## Environment

Mobile public variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Landing public variables:

- `VITE_APP_STORE_URL`
- `VITE_PLAY_STORE_URL`

Public variables are embedded in client bundles. Never place service-role keys, database passwords, ad verification secrets, or payment secrets in either app.
