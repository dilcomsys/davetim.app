# Mobile v1 scope

> Historical scope note: this narrow v1 plan was superseded on 2026-08-03 by the full web-to-mobile parity program in [WEB-TO-MOBILE-PARITY.md](./WEB-TO-MOBILE-PARITY.md). Its delivery slices remain useful, but the listed exclusions are now later slices rather than cancelled features.

## Goal

Ship a reliable mobile-first invitation workflow while preserving the existing Supabase data model and the small set of current users.

## Included

- Email authentication and session persistence
- Template browsing and category filters
- Create, edit, preview, and publish an invitation
- Shareable public invitation link
- RSVP collection and guest-list summary
- My invitations list and simple account settings
- Single-use rewarded bonuses where store policy permits
- Privacy controls, ad disclosure, and support/report paths

## Deferred beyond the original v1 slice

- In-app purchases and subscriptions
- Paid web checkout
- QR media upload/gallery
- Advanced analytics exports
- Collaborative editing
- Marketplace or user-submitted public templates
- Automated migration that rewrites existing production rows

## Delivery slices

### Slice 0 — foundation (implemented)

- Expo SDK 57 + React Native 0.86 + typed Expo Router
- Four-tab application shell
- Shared mobile/landing visual tokens
- Supabase environment boundary with persistent local auth storage
- Rewarded-ad interface with a disabled development adapter

### Slice 1 — account and read-only data

- Sign in, sign out, reset password, deep-link callback
- Read existing profile, templates, and invitations
- Test RLS using a dedicated staging user
- No schema change

### Slice 2 — invitation workflow

- Create draft using current columns only
- Mobile editor with explicit autosave state
- Preview and publish
- Public invitation and RSVP compatibility tests

### Slice 3 — rewarded bonuses

- Consent and age/audience configuration
- Store-policy review gate per platform
- Test ad units only
- Server-side verification and idempotent entitlement grant
- Remote kill switch before production activation

## Definition of done for store submission

- Critical paths pass on a physical iPhone and Android device.
- Privacy policy, support URL, account deletion, and ad-reporting paths are live.
- Demo/review account and clear App Review notes are ready.
- No placeholder content or inactive UI is present in the submitted binary.
- Store screenshots match the shipped application.
