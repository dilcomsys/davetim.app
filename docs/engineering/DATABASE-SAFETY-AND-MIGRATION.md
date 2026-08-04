# Database safety and migration

## Current constraint

The production Supabase project has approximately two to three real free users. Small user count does not make destructive changes acceptable. Existing authentication, invitations, RSVPs, templates, and storage objects must remain readable throughout the mobile transition.

No database change was executed during the initial mobile setup.

## Non-negotiable rules

1. Never edit production tables from the Supabase dashboard without a reviewed SQL migration.
2. Never expose the service-role key to mobile or landing code.
3. Every user-owned table must have RLS enabled and an ownership policy tested as two different users.
4. Prefer additive nullable columns/tables. Do not rename, drop, or change a type in the same release that introduces its replacement.
5. Make migrations idempotent where practical and give every migration a rollback or forward-fix plan.
6. Back up schema and data before production changes and record row counts for affected tables.
7. Deploy in expand–migrate–contract phases; contract only after at least one stable mobile release and verified zero legacy reads.

## Required preflight

- Identify the exact production project and confirm the CLI target.
- Export schema and a data backup.
- Capture counts for affected tables and storage buckets.
- Run the migration against a separate staging project restored from production structure.
- Run RLS tests for owner, different authenticated user, and anonymous user.
- Confirm old web-shaped records still deserialize in the mobile client.
- Review long-running locks and index creation strategy.
- Schedule a rollback owner and monitoring window.

## Safe rollout sequence

1. Add new tables/nullable columns and restrictive RLS policies.
2. Deploy mobile code that can read old and new representations.
3. Backfill in bounded batches with progress and reconciliation queries.
4. Switch writes behind a server-controlled feature flag.
5. Observe errors and row-count invariants.
6. Remove legacy columns only in a later migration after explicit approval.

## Reward entitlement migration

The proposed `rewarded_ad_events` and `feature_entitlements` tables in the ad plan are not yet migrations. Before implementation:

- confirm existing invitation primary-key and auth-user types;
- choose whether an entitlement can exist without an invitation;
- add a unique provider transaction constraint;
- allow inserts only from a verified Edge Function/service role;
- allow users to select only their own rows;
- consume entitlements atomically in one database function;
- verify retry safety by replaying the same provider callback.

## Emergency rollback

The first response to a mobile data incident is to disable the affected remote feature flag and stop new writes. Do not drop data to “undo” a release. Restore code compatibility first, preserve evidence, reconcile impacted rows, and then apply a reviewed forward fix or targeted restore.
