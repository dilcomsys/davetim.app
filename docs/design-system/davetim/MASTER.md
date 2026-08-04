# Davetim design system

This describes what is actually shipping. The two implementations are:

- `apps/landing/src/index.css` — CSS custom properties
- `apps/mobile/src/theme/tokens.ts` — the same roles as TypeScript constants

They carry identical values. Change one and change the other, or the two
surfaces drift apart.

One naming trap: the mobile keys `colors.primary` and `colors.secondary` are
older names that no longer match their roles. `primary` is the bole red, used
for emphasis and the single destructive control; `secondary` is the cobalt that
every primary button and link uses. Read the table below rather than the key
names.

> The previous version of this file was generator output: an orange palette,
> `Great Vibes` / `Cormorant Infant` as the typefaces, `Category: Pet Tech
> App`, and component CSS for buttons that do not exist. None of it was ever
> built. Replaced on 2026-08-03 with what is in the code.

## Direction

The palette is taken from İznik tilework, the ornament already found on Turkish
wedding and engagement stationery: a porcelain body, a cobalt outline, a
turquoise fill, and the red the potters called Armenian bole.

That choice is deliberate. The scheme before it — warm cream with a terracotta
accent and a Georgia display face — said nothing about invitations and is the
default an AI or a template reaches for. Cobalt on porcelain is specific to the
subject and reads as stationery rather than as a generic consumer app.

## Colour

| Role | Value | CSS | Mobile |
|---|---|---|---|
| Ground | `#FAF8F3` | `--porcelain` | `colors.canvas` |
| Raised ground | `#F2EDE4` | `--porcelain-deep` | `colors.surfaceWarm` |
| Surface | `#FFFFFF` | `--white` | `colors.surface` |
| Action and structure | `#1B3FA0` | `--cobalt` | `colors.secondary` |
| Deep structure | `#142E77` | `--cobalt-deep` | `colors.plum` |
| Action wash | `#E3E9FA` | `--cobalt-soft` | `colors.secondarySoft` |
| Emphasis and destructive | `#C0362C` | `--bole` | `colors.primary` |
| Emphasis pressed | `#A22B22` | `--bole-deep` | `colors.primaryPressed` |
| Secondary accent | `#1E8E9E` | `--turquoise` | `colors.accent` |
| Ornament | `#B08341` | `--gold` | `colors.gold` |
| Text | `#171A2B` | `--ink` | `colors.ink` |
| Muted text | `#555B6D` | `--ink-soft` | `colors.inkMuted` |
| Rule | `#DED4C4` | `--rule` | `colors.border` |

Rules that are easy to get wrong:

- **Cobalt is the action colour.** Primary buttons, the site CTA, links, icons
  and filled navigation are all cobalt on both surfaces. Mobile used to fill
  its primary button with bole and set the label in dark ink, which clashed
  with the site and failed contrast on the red.
- **Bole is emphasis, not action.** The italic clause in the hero headline, the
  step numbers, the fold on the seal — and exactly one destructive control,
  `PrimaryButton variant="destructive"`, used only for account deletion.
- Gold is a hairline only: creases, rules, the two marks on the seal. Never a
  fill, never text.
- On the deep cobalt fill, text is `colors.onPlum` (`#DCE4FA`) or white.
  `inkMuted` on that background fails contrast — that bug shipped once already
  on the profile screen.

## Type

| Role | Stack |
|---|---|
| Display | `Iowan Old Style`, `Palatino Linotype`, Palatino, `Book Antiqua`, Georgia, serif |
| Body | `Avenir Next`, Avenir, `Segoe UI`, system-ui, Helvetica, Arial, sans-serif |

No web fonts are loaded. A hosted font would add a third-party request to a
product that tells its users it minimises those, and the mobile app could not
match it without bundling the file anyway.

### The engraved label

Every eyebrow and small label uses one treatment: uppercase, ~0.68rem,
weight 700, letter-spacing `0.22em`, cobalt. Mobile exports it as `engraved` in
the token file. It is the one typographic gesture that repeats, so labels read
as a system instead of as decoration.

## The seal

`apps/landing/src/Seal.tsx` and `apps/mobile/src/components/brand-mark.tsx`
draw the same mark: a serif D inside a hairline ring, with two gold marks on
the horizontal axis. The letter is a path, not text, so both platforms render
the same letterform rather than substituting whatever serif they ship.

Three earlier attempts are recorded so they are not repeated:

1. An İznik rosette with petals and twelve dots — mush below 32px.
2. A monogram D with a triangular counter — stopped reading as a D once the
   counter was large enough to see.
3. A folded card in a cobalt tile — legible, but read as a flat product icon
   rather than as stationery.

The mark appears in the header, on the hero invitation, on the download panel
and in the footer. A fifth placement turns it into wallpaper.

## Motion

Landing motion is framer-motion and follows two rules:

- One orchestrated entrance. The hero runs a single staggered sequence and
  nothing else on the page competes with it.
- Everything below the fold is a quiet fade and rise, on first view only
  (`viewport={{ once: true }}`).

`useReducedMotion()` gates every initial state, and the stylesheet also
collapses transition and animation durations under
`prefers-reduced-motion: reduce`.

## Shared devices

Three things repeat on both surfaces. They are what make the app read as the
website rather than as a companion product:

| Device | Landing | Mobile |
|---|---|---|
| Engraved label | `.engraved` | `engraved` token, `<Engraved>` |
| Printed card: hairline frame inset from the edge, short gold rule under the heading | `.paper-invite` | `<PaperCard>`, `<GoldRule>` |
| Hairline-ruled list instead of boxed rows | `.steps-list`, `.faq-list` | `borderTopWidth: StyleSheet.hairlineWidth` rows |

The printed card carries the guest-facing screens — the public invitation and
the RSVP form — because those are the two places a guest meets the brand
before they ever see the site.

## Spacing and radius

Mobile exports `spacing` (4 / 8 / 12 / 16 / 24 / 32 / 48) and `radius`
(12 / 18 / 26 / pill). The landing page uses the same three radii as
`--radius-sm`, `--radius-md`, `--radius-lg`.

## Store badges

`apps/landing/src/StoreBadges.tsx` renders the App Store and Google Play marks
inline: the store icon as SVG, the label as HTML so the text rasterises
correctly on every platform. While `VITE_APP_STORE_URL` and
`VITE_PLAY_STORE_URL` are empty the badge renders as a non-link with a
"çok yakında" strip, because a badge that looks live and goes nowhere is worse
than one that admits it is not ready.
