# Local development

## Requirements

- Node.js 22.13 or newer (Expo SDK 57 requirement)
- npm
- iOS Simulator/Xcode or Android Studio for native device work

## Install

```bash
npm run install:apps
```

## Mobile

**Expo Go does not run this app.** Use a development build:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
cd apps/mobile && npx expo run:ios      # or: npx expo run:android
```

The build takes a few minutes the first time; afterwards `npm run mobile`
serves it like any other project.

Two reasons Expo Go fails, both verified on 2026-08-03:

1. `react-native-google-mobile-ads` is not in the Expo Go binary. Its spec
   files call `TurboModuleRegistry.getEnforcing(...)` while being evaluated,
   which throws when the native module is missing. The rewarded-ad gateway now
   imports the package lazily so nothing touches it at startup, but the ads
   feature itself still needs a development build.
2. Even with that fixed, Expo Go dies on launch with `SIGSEGV` inside
   `worklets::JSIWorkletsModuleProxy::toOptimizedObject` — the Reanimated 4
   worklets runtime. A blank SDK 57 project runs fine in the same Expo Go, and
   so does a blank project with the same reanimated, worklets and
   gesture-handler versions, so it is specific to this app's startup path.
   Removing `react-native-reanimated` and `react-native-worklets` stops the
   segfault, which is what identified the component, but that is not a fix:
   the editor's gesture handling depends on them.

The development build runs the app correctly, so this is an Expo Go limitation
rather than a release blocker. Do not spend time making Expo Go work.

The app starts safely without a `.env.local`; it remains disconnected from Supabase.

## Landing

```bash
cp apps/landing/.env.example apps/landing/.env.local
npm run landing
```

Empty store URLs render disabled “Yakında” buttons. Add real listing URLs only after the store pages exist.

## Babel

`apps/mobile/babel.config.js` must exist. It went missing during the repository
restructure, and without it Babel applies no preset at all — including the
worklets plugin that transforms Reanimated worklet functions. Deleting it
produces failures that look like native crashes rather than build errors.

## Checks

```bash
npm run check
```

This runs the mobile TypeScript check, both linters, and the landing production build.

## Native ads

The live mobile ads package is intentionally not installed. When the policy gate is approved, use an Expo development build; native ad modules do not run inside Expo Go. Start with provider test IDs and keep production ad IDs outside source control.
