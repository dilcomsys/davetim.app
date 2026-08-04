# ADR 0001: React Native with Expo

- Status: accepted
- Date: 2026-08-03

## Context

The retired frontend is a React/TypeScript SPA backed by Supabase. The mobile rewrite must move quickly without carrying the old browser-specific UI and payment assumptions into the new application.

## Decision

Use React Native with Expo SDK 57, Expo Router, and strict TypeScript.

## Reasons

- Existing React and TypeScript knowledge transfers directly.
- Supabase and pure domain types can remain TypeScript.
- Expo provides a managed native workflow while allowing native development builds for ad SDKs later.
- Typed file-based routes and over-the-air JavaScript updates reduce early operational overhead.

## Consequences

- The legacy DOM/Tailwind UI is not copied; screens are rebuilt for native interaction.
- Native ad SDK integration requires development builds rather than Expo Go.
- Bundle identifiers and store metadata must be confirmed before the first signed build.
- Flutter is not pursued unless a future native performance or staffing constraint justifies a new decision.
