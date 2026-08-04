# Davetim

Davetim is transitioning from a legacy web product to a mobile-first digital invitation platform.

## Active applications

- `apps/mobile`: React Native + Expo mobile application (SDK 57)
- `apps/landing`: React + Vite application-download landing page
- `database`: existing Supabase SQL assets; no automatic production migration
- `supabase`: existing Edge Functions

The retired React web application and its deployment files are preserved in `archive/web-legacy`.

## Start locally

```bash
npm run install:apps
npm run mobile
```

In a second terminal:

```bash
npm run landing
```

Copy each app's `.env.example` to `.env.local` only when local credentials or store URLs are needed.

## Verification

```bash
npm run check
```

## Documentation

Start with [`docs/README.md`](docs/README.md). Architecture, mobile scope, ad strategy, database safety, release notes, and the legacy document archive all live under `docs`.

> Production database safety: this repository currently serves a small number of real users. Do not run SQL or change RLS policies without the checklist in `docs/engineering/DATABASE-SAFETY-AND-MIGRATION.md`.
