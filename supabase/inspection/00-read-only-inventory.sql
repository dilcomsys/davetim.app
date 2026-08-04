-- Read-only inventory for the mobile backend contract.
--
-- Run this against the target Supabase project BEFORE applying anything in
-- supabase/migrations. Every statement here is a SELECT; nothing is modified.
-- Record the output in the migration review issue described in
-- docs/engineering/DATABASE-SAFETY-AND-MIGRATION.md.

-- 1. Project identity. Confirm this matches EXPO_PUBLIC_SUPABASE_URL.
select current_database() as database_name, version() as server_version;

-- 2. Tables the mobile client reads or writes, and whether RLS is enabled.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'invitations', 'templates', 'template_categories', 'user_templates',
    'guests', 'invitation_guests', 'media', 'guest_uploads',
    'subscriptions', 'payment_history', 'profiles',
    'reward_intents', 'reward_receipts', 'upload_tickets',
    'account_deletion_requests', 'mobile_rate_limits'
  )
order by c.relname;

-- 3. Column shape of every table the contract touches.
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'invitations', 'templates', 'user_templates', 'guests',
    'invitation_guests', 'media', 'guest_uploads'
  )
order by table_name, ordinal_position;

-- 4. Existing policies. The migrations must not silently replace these.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 5. Existing functions, their volatility, security mode and search_path.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '), '(none)') as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 6. Execute grants that expose functions to anon or authenticated.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       r.rolname as granted_role
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral (values ('anon'), ('authenticated'), ('service_role')) as g(role_name)
join pg_roles r on r.rolname = g.role_name
where n.nspname = 'public'
  and has_function_privilege(r.oid, p.oid, 'execute')
order by p.proname, r.rolname;

-- 7. Storage buckets and their public flag. qr-media must be private.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

-- 8. Row counts. Confirms how much production data the migrations affect.
select 'invitations' as table_name, count(*) from public.invitations
union all select 'guests', count(*) from public.guests
union all select 'media', count(*) from public.media
union all select 'guest_uploads', count(*) from public.guest_uploads
union all select 'user_templates', count(*) from public.user_templates
union all select 'templates', count(*) from public.templates;

-- 9. Legacy guest split. Rows here must be reconciled before writes are enabled.
select to_regclass('public.invitation_guests') as legacy_table,
       (select count(*) from public.guests) as canonical_guest_rows;

-- 10. Whether the additive media/guest_uploads columns already exist. The
-- migrations add them with ADD COLUMN IF NOT EXISTS, so both answers are safe.
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('media', 'guest_uploads')
  and column_name in ('storage_path', 'storage_url', 'status', 'consent_at')
order by table_name, column_name;
