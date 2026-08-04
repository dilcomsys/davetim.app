#!/usr/bin/env bash
#
# Creates the Firebase project and both apps, then writes the service files the
# native build needs.
#
# Idempotent on purpose: every step checks for what it is about to create, so a
# re-run after a failure picks up where it stopped rather than making a second
# project. Firebase project IDs are globally unique and cannot be deleted for
# 30 days, so "just run it again" has to be safe.
#
# Requires: firebase-tools, and a valid login (`firebase login --reauth`).

set -euo pipefail

PROJECT_ID="${FIREBASE_PROJECT_ID:-davetim-app}"
DISPLAY_NAME="${FIREBASE_DISPLAY_NAME:-Davetim}"
IOS_BUNDLE_ID="app.davetim.mobile"
ANDROID_PACKAGE="app.davetim.mobile"

# Written next to app.json, which is where the Expo config plugin looks.
MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_PLIST="${MOBILE_DIR}/GoogleService-Info.plist"
ANDROID_JSON="${MOBILE_DIR}/google-services.json"

info() { printf '\033[1;34m›\033[0m %s\n' "$1"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$1"; }

# `login:list` reports a stored account even when its credentials have expired,
# so it is not a usable check on its own — it printed "Logged in as ..." while
# every real call failed with an auth error. A cheap authenticated call is the
# only honest test.
if ! firebase projects:list --json >/dev/null 2>&1; then
  echo "Firebase credentials are missing or expired." >&2
  echo "Run this first, then re-run this script:" >&2
  echo "  firebase login --reauth" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------
if firebase projects:list --json 2>/dev/null | grep -q "\"projectId\": \"${PROJECT_ID}\""; then
  ok "Project ${PROJECT_ID} already exists"
else
  info "Creating project ${PROJECT_ID}"
  firebase projects:create "${PROJECT_ID}" --display-name "${DISPLAY_NAME}"
  ok "Project created"
fi

# ---------------------------------------------------------------------------
# Apps
# ---------------------------------------------------------------------------
apps_json="$(firebase apps:list --project "${PROJECT_ID}" --json 2>/dev/null || echo '{}')"

# Reads an existing app's ID out of `apps:list --json`.
#
# The JSON is piped in rather than passed with a here-string alongside a
# here-doc: stacking both redirections silently wins with the last one, so
# `python3 -` received the JSON where it expected its program and produced
# nothing. The symptom was an empty app ID and an attempt to create an app that
# already existed.
#
# The CLI reports the bundle id / package name as `namespace`; `bundleId` and
# `packageName` are accepted too because the Management API uses those names.
app_id_for() {
  printf '%s' "${apps_json}" | python3 -c '
import json, sys
platform, identifier = sys.argv[1], sys.argv[2]
try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit
apps = payload if isinstance(payload, list) else (payload.get("result") or [])
for app in apps:
    if not isinstance(app, dict) or app.get("platform") != platform:
        continue
    if identifier in (app.get("namespace"), app.get("bundleId"), app.get("packageName")):
        print(app.get("appId", ""))
        raise SystemExit
print("")
' "$1" "$2"
}

IOS_APP_ID="$(app_id_for IOS "${IOS_BUNDLE_ID}")"
if [ -z "${IOS_APP_ID}" ]; then
  info "Creating iOS app (${IOS_BUNDLE_ID})"
  firebase apps:create IOS "Davetim iOS" --bundle-id "${IOS_BUNDLE_ID}" --project "${PROJECT_ID}"
  apps_json="$(firebase apps:list --project "${PROJECT_ID}" --json)"
  IOS_APP_ID="$(app_id_for IOS "${IOS_BUNDLE_ID}")"
fi
if [ -z "${IOS_APP_ID}" ]; then
  echo "Could not resolve the iOS app ID from apps:list." >&2
  exit 1
fi
ok "iOS app: ${IOS_APP_ID}"

ANDROID_APP_ID="$(app_id_for ANDROID "${ANDROID_PACKAGE}")"
if [ -z "${ANDROID_APP_ID}" ]; then
  info "Creating Android app (${ANDROID_PACKAGE})"
  firebase apps:create ANDROID "Davetim Android" --package-name "${ANDROID_PACKAGE}" --project "${PROJECT_ID}"
  apps_json="$(firebase apps:list --project "${PROJECT_ID}" --json)"
  ANDROID_APP_ID="$(app_id_for ANDROID "${ANDROID_PACKAGE}")"
fi
if [ -z "${ANDROID_APP_ID}" ]; then
  echo "Could not resolve the Android app ID from apps:list." >&2
  exit 1
fi
ok "Android app: ${ANDROID_APP_ID}"

# ---------------------------------------------------------------------------
# Service files
# ---------------------------------------------------------------------------
# `apps:sdkconfig --out` refuses to overwrite, so an existing file is left alone
# rather than failing the run. Set FIREBASE_REFRESH_CONFIG=1 to pull fresh
# copies — needed after rotating an API key or changing the bundle id.
write_config() {
  # $1 = IOS|ANDROID, $2 = app id, $3 = destination
  if [ -f "$3" ] && [ "${FIREBASE_REFRESH_CONFIG:-0}" != "1" ]; then
    ok "$(basename "$3") already present (FIREBASE_REFRESH_CONFIG=1 to refresh)"
    return
  fi
  rm -f "$3"
  info "Writing $3"
  firebase apps:sdkconfig "$1" "$2" --project "${PROJECT_ID}" --out "$3"
}

write_config IOS "${IOS_APP_ID}" "${IOS_PLIST}"
write_config ANDROID "${ANDROID_APP_ID}" "${ANDROID_JSON}"

ok "Done. Both service files are in apps/mobile/ and are gitignored."
echo
echo "Next:"
echo "  1. npx expo config --type public   # the Firebase warning should be gone"
echo "  2. Analytics needs a native build — it is a no-op in Expo Go."
