# Analytics, prompts and notifications

Added 2026-08-04. Three features that all interrupt or observe the user, so the
notes below are mostly about restraint.

## Firebase Analytics

`@react-native-firebase/analytics`, behind a `.native` / `.web` gateway like the
ads module. The web build sends nothing on purpose: it serves the public
invitation and RSVP pages, which guests open from a link without agreeing to
anything, and measuring them would mean a consent banner and a second processor
to disclose for traffic nobody makes decisions from.

The Firebase module is imported on demand, never at module scope, because it
reaches for a native module during evaluation and throws where that module is
absent — Expo Go, or any build without the service files. Analytics is
initialised from the root layout, so a static import would take down launch.

**Every event is declared in `src/features/analytics/events.ts`.** Firebase
silently drops names that break its rules — over 40 characters, a dash, a
reserved prefix — with no error and no event, which surfaces weeks later as a
hole in a funnel. `events.test.ts` fails the build instead.

`sign_up` and `login` deliberately use Firebase's own names so the built-in
acquisition reports work. The SDK types those two through overloads with
required parameter shapes; the gateway narrows the call rather than giving up
the standard names.

Identity is bound in `auth-provider` from the session subscription, not from the
sign-in screens — there are four ways to end up with a session and only the
subscription sees all of them. The identifier is the Supabase user ID, never an
e-mail or a name, and it is cleared on sign-out so a shared device does not
attribute the next account's events to the previous one.

### Firebase project

Created 2026-08-04 with `apps/mobile/scripts/setup-firebase.sh`.

| | |
|---|---|
| Project | `davetim-app` (number `457865310464`) |
| iOS app | `1:457865310464:ios:ff63d25b778489446183e5`, bundle `app.davetim.mobile` |
| Android app | `1:457865310464:android:4709277b4c93f79f6183e5`, package `app.davetim.mobile` |

`GoogleService-Info.plist` and `google-services.json` live in `apps/mobile/` and
are gitignored — they are per-environment downloads, not code. Without them the
config plugin is skipped, the build warns, and the gateway no-ops; the app works
either way, the dashboards just stay empty.

The script is idempotent: it checks for the project and each app before creating
anything, because Firebase project IDs are globally unique and cannot be deleted
for 30 days, so a half-finished run has to be safe to repeat. Existing service
files are left alone unless `FIREBASE_REFRESH_CONFIG=1` is set.

The Android app exists but Android is not being published yet; having it costs
nothing and means the config is ready when that changes.

Collection is enabled explicitly at startup rather than left to the defaults.
The generated plist ships `IS_ANALYTICS_ENABLED` set to false — that key does
not actually govern collection, the iOS SDK reads
`FIREBASE_ANALYTICS_COLLECTION_ENABLED` from Info.plist — but depending on which
of two similarly named keys wins is how a release ends up with empty dashboards
and no error.

## Update and review prompts

One provider, one decision, at most one prompt per launch. This is not a
convenience: on iOS the rating request is a system alert the app cannot see or
dismiss, so an update sheet and a rating request racing each other leaves a
system dialog stacked over a modal.

Priority is forced update, then optional update, then review. A forced update
means the build can no longer talk to the backend safely; asking someone to rate
a build you are about to replace also wastes the one rating prompt per version
the platforms allow.

`decidePrompt` is pure and tested, including the case that decides whether a
forced update fires against the newest build — string comparison puts `1.10.0`
before `1.9.0`. A malformed or missing release row is inert by construction: it
must never lock anyone out.

Prompts wait `2500 ms` after launch so they do not land mid-transition with the
splash screen and the first data load.

### Operating it

`public.app_releases`, one row per platform:

- `min_supported_version` — anything older gets the blocking sheet. Leave it at
  the oldest build you still support.
- `latest_version` — anything older gets the dismissible sheet, once per target
  version.
- `store_url` — **without this neither sheet is shown at all**, since there is
  nowhere to send the user.
- `notes` — shown to the user, so write them for users.

The review request fires after three days of ownership and two published
invitations, at most once per app version and once per 120 days.

## Notifications

### What is sent

| Trigger | Notification |
|---|---|
| Guest answers a published invitation | "Zeynep katılıyor (+2 kişi)." |
| Guest uploads to the QR gallery | "Zeynep galeriye yeni bir fotoğraf ekledi." |
| Evening before a published event | "… yarın. Son hazırlıklara göz at." |
| Morning of a published event | "… bugün. N yanıt aldın." |

The first two are server push. The last two are **local** notifications
scheduled on the device: the date is already on the phone, they need no network
and no push token, and they keep every user's event calendar off the server's
scheduling path.

### How the server side works

A trigger on `guests` writes to `notification_outbox` — only on a real
transition into an answer, so editing a note on an already-answered guest sends
nothing. The message text is composed in SQL at enqueue time, because the
database is the only place that can see the guest's name under the right
ownership rules; the dispatcher never reads guest PII, it only moves rows.

A statement-level trigger then wakes `dispatch-notifications` through `pg_net`.
**No secret is passed.** The endpoint accepts no body, no parameters and no
identifiers — it flushes what the database already decided to send. That is what
lets a trigger call it without embedding a key in a SQL string, which is exactly
how the retired cron job leaked the service role key. The worst an anonymous
caller can do is ask the queue to drain sooner.

`mobile_claim_notifications` increments `attempts` in the same statement that
selects the batch and uses `for update skip locked`, so two overlapping runs
cannot send the same notification twice. Rows give up after three attempts.
Tokens Expo reports as `DeviceNotRegistered` are deleted.

Verified against production: a real RSVP through `submit_guest_rsvp` queued one
row, the trigger woke the dispatcher (pg_net logged a 200), and the row settled
without any manual call. An unrelated edit to the same guest queued nothing. A
muted preference recorded the row as `skipped` rather than `pending`.

This also puts `pg_net` back to work; it had been left installed but unused
after the billing cron job was removed.

### Permission

Asked for **only** from the notification settings screen, never on launch. iOS
shows the system prompt once per install; spending it on a first-run modal
before the user has any guests means most installs deny it permanently and the
RSVP notification — the reason the feature exists — never works for them.

`blocked` is kept distinct from `denied` because only the first requires a trip
to system settings, and the screen offers a different action for each.

### Push tokens need an EAS project ID

`getExpoPushTokenAsync` requires `extra.eas.projectId`, which `eas init` writes
and which this app does not have yet. Until it does, granting the permission
succeeds and registers no token: server push silently reaches nobody, while the
**local** event reminders keep working, since they need neither a token nor a
network. Run `eas init` in `apps/mobile` before relying on RSVP notifications.

## Legal

The privacy policy and the KVKK text now name Firebase Analytics, the Expo push
service and APNs/FCM, and describe the push token and the usage events as
processed data. Adding a processor without disclosing it is the kind of gap a
store review finds.
