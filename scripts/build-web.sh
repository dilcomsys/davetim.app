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
# Mobile web export
# ---------------------------------------------------------------------------
info "Exporting the mobile web build"
(
  cd "${ROOT}/apps/mobile"
  # Ads are a native-only feature; leaving the flag on would make app.config
  # demand AdMob IDs for a build that can never show an ad.
  EXPO_PUBLIC_ENABLE_REWARDED_ADS=false npx expo export --platform web --output-dir "${MOBILE_EXPORT}" >/dev/null
)
ok "Mobile export ready"

# ---------------------------------------------------------------------------
# Landing
# ---------------------------------------------------------------------------
info "Building the landing site"
(cd "${ROOT}/apps/landing" && npm run build >/dev/null)
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
mkdir -p "${OUT}/i" "${OUT}/rsvp" "${OUT}/media"
cp "${MOBILE_EXPORT}/i/[invitationId].html"   "${OUT}/i/"
cp "${MOBILE_EXPORT}/rsvp/[guestToken].html"  "${OUT}/rsvp/"
cp "${MOBILE_EXPORT}/media/[qrCode].html"     "${OUT}/media/"

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
# Guest-facing routes from the Expo web export. The filenames keep Expo's
# dynamic-segment brackets, so each one is rewritten explicitly.
/i/*            /i/[invitationId].html    200
/rsvp/*         /rsvp/[guestToken].html   200
/media/*        /media/[qrCode].html      200

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
