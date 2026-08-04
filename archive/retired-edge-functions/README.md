# Retired Edge Functions

Both belonged to the web product and neither is deployed any more.

- **contact-form** — served the web contact page. Deleted from the Supabase
  project on 2026-08-04 after confirming nothing in the mobile app, the landing
  app or any migration called it. Source kept here rather than thrown away.
- **subscription-expiration-reminder** — driven by a cron job that
  `20260803090600_decommission_payments.sql` unscheduled. It was never
  redeployed after that, so it was already dead on the server.

They live outside `supabase/functions` so the Deno format, lint and type checks
in CI cover only code that actually runs, and so `supabase functions deploy`
cannot pick them up by accident.
