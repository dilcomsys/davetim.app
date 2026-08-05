#!/usr/bin/env bash
#
# Builds the single site that davetim.app serves.
#
# Two apps share the origin because they own different paths and the mobile
# client hard-codes that origin in every link it hands out:
#
#   apps/landing   →  /  /privacy  /terms  /support  /account-deletion
#                     plus app-ads.txt, which AdMob crawls
#   apps/mobile    →  /i/*  /rsvp/*  /media/*
#                     the guest-facing pages, which exist only in the Expo
#                     web export
#
# Only those three route families are taken from the mobile export. The rest of
# the app — editor, invitations, account — is behind a sign-in and has no reason
# to be reachable on the web; shipping it would only widen the surface and
# invite confusion about which is "the app".
#
# Output: dist-web/ at the repository root. Point Cloudflare Pages at it.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${ROOT}/dist-web"
LANDING_DIST="${ROOT}/apps/landing/dist"
MOBILE_EXPORT="${ROOT}/apps/mobile/dist-web-build"

info() { printf '\033[1;34m›\033[0m %s\n' "$1"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$1"; }

rm -rf "${OUT}" "${MOBILE_EXPORT}"

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
# The repository is not an npm workspace: the root package.json has no
# dependencies and each app carries its own lockfile. A CI host that runs
# `npm install` at the root therefore installs nothing, and `npx expo` then
# fetches a bare copy of Expo with none of the project's packages beside it —
# which fails with "No platforms are configured to use the Metro bundler",
# because expo-router and the Metro config were never installed.
#
# Installing here rather than relying on the host keeps the script correct
# wherever it runs. `npm ci` is used for a reproducible tree; the check for an
# existing node_modules keeps repeat local runs fast, since ci would otherwise
# delete and reinstall every time.
install_deps() {
  local app="$1"
  if [ -d "${ROOT}/apps/${app}/node_modules" ]; then
    ok "${app}: dependencies already present"
    return
  fi
  info "${app}: installing dependencies"
  if [ -f "${ROOT}/apps/${app}/package-lock.json" ]; then
    npm ci --prefix "${ROOT}/apps/${app}" --no-audit --no-fund
  else
    npm install --prefix "${ROOT}/apps/${app}" --no-audit --no-fund
  fi
}

install_deps mobile
install_deps landing

# ---------------------------------------------------------------------------
# Mobile web export
# ---------------------------------------------------------------------------
info "Exporting the mobile web build"
(
  cd "${ROOT}/apps/mobile"
  # Ads are a native-only feature; leaving the flag on would make app.config
  # demand AdMob IDs for a build that can never show an ad.
  # The locally installed binary, not `npx expo`. npx will happily download a
  # standalone copy of Expo when it cannot resolve one, and that copy has none
  # of the project's packages beside it — which is what produced "No platforms
  # are configured to use the Metro bundler" on the first deployment.
  EXPO_PUBLIC_ENABLE_REWARDED_ADS=false ./node_modules/.bin/expo export --platform web --output-dir "${MOBILE_EXPORT}" >/dev/null
)
ok "Mobile export ready"

# ---------------------------------------------------------------------------
# Landing
# ---------------------------------------------------------------------------
info "Building the landing site"
(cd "${ROOT}/apps/landing" && ./node_modules/.bin/vite build >/dev/null)
ok "Landing build ready"

# ---------------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------------
mkdir -p "${OUT}"

# Shared runtime first: the route pages below are useless without it.
cp -R "${MOBILE_EXPORT}/_expo" "${OUT}/_expo"
cp -R "${MOBILE_EXPORT}/assets" "${OUT}/assets"

# The three guest-facing route families. `media/manage` is an owner screen and
# is deliberately left behind.
#
# The bracketed filenames Expo emits are renamed on the way in. Cloudflare Pages
# answered a rewrite whose destination was `/i/[invitationId].html` with a 308
# to `/i/[invitationId]`, which matched the same `/i/*` rule again and looped
# until the browser gave up — every shared invitation link was dead. Plain
# names have no such normalisation, and the shell is identical either way since
# the route is resolved client-side from the URL.
mkdir -p "${OUT}/_shell/invitation" "${OUT}/_shell/rsvp" "${OUT}/_shell/gallery"
cp "${MOBILE_EXPORT}/i/[invitationId].html"   "${OUT}/_shell/invitation/index.html"
cp "${MOBILE_EXPORT}/rsvp/[guestToken].html"  "${OUT}/_shell/rsvp/index.html"
cp "${MOBILE_EXPORT}/media/[qrCode].html"     "${OUT}/_shell/gallery/index.html"

# Landing last so its index.html owns `/`. It is the only file the two builds
# both produce; everything else lives in a different path.
cp -R "${LANDING_DIST}/." "${OUT}/"

# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------
# Cloudflare Pages takes the first matching rule, so the specific rewrites have
# to precede the landing catch-all. Static files are served before any of this
# is consulted, which is what keeps /app-ads.txt and /assets/* intact.
cat > "${OUT}/_redirects" <<'REDIRECTS'
# Guest-facing routes from the Expo web export.
#
# Destinations are directories, not files. Everything else was measured on the
# live site and failed:
#
#   /_shell/invitation.html        308 -> /_shell/invitation   (loses the id)
#   /_shell/invitation/index.html  308 -> /_shell/invitation/  (rule is then
#                                          dropped and the request falls
#                                          through to the landing catch-all,
#                                          so a guest sees the marketing page)
#   /_shell/invitation/            200, no redirect             <- this one
#
# A destination that would itself redirect makes Pages skip the rule, which is
# why the second form looked like "no redirect" while quietly serving the wrong
# app.
/i/*            /_shell/invitation/   200
/rsvp/*         /_shell/rsvp/         200
/media/*        /_shell/gallery/      200

# Everything else is the landing single-page app.
/*              /index.html               200
REDIRECTS

cat > "${OUT}/_headers" <<'HEADERS'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

# AdMob's crawler needs this as plain text, not as the SPA shell.
/app-ads.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=3600
HEADERS

ok "Merged into ${OUT}"
echo
echo "Contents:"
printf '  %s\n' "$(du -sh "${OUT}" | cut -f1) total"
printf '  %s\n' "$(find "${OUT}" -type f | wc -l | tr -d ' ') files"
