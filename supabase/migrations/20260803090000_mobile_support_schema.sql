-- Mobile contract: support schema.
--
-- Additive only. Creates the tables the Expo client depends on that do not
-- exist in the legacy web schema, plus the shared helpers used by every
-- security-definer function in later migrations.
--
-- This migration does not alter any existing column, policy, or function.
-- Run supabase/inspection/00-read-only-inventory.sql first.

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- gen_random_bytes and digest come from pgcrypto. Supabase installs
-- extensions into the `extensions` schema, and every function below keeps
-- `search_path = public, pg_temp`, so those calls are schema-qualified rather
-- than reachable through the search path.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.mobile_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Owner check used by every write RPC. Returns false for anonymous callers.
create or replace function public.mobile_is_invitation_owner(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.invitations i
    where i.id = p_invitation_id
      and i.user_id = auth.uid()
  );
$$;

revoke all on function public.mobile_is_invitation_owner(uuid) from public;
grant execute on function public.mobile_is_invitation_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Rate limiting
-- ---------------------------------------------------------------------------
-- Fixed-window counter. Keys are opaque strings built by the caller, never
-- raw guest tokens: callers pass a hash. Rows are pruned opportunistically.

create table if not exists public.mobile_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null default now(),
  hit_count integer not null default 0
);

alter table public.mobile_rate_limits enable row level security;
-- No policies: only security-definer functions and service_role touch this.

create index if not exists mobile_rate_limits_window_start_idx
  on public.mobile_rate_limits (window_start);

-- Returns true when the call is allowed, false when the limit is exhausted.
create or replace function public.mobile_consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  if p_key is null or p_limit is null or p_limit <= 0 then
    return false;
  end if;

  delete from public.mobile_rate_limits
  where window_start < now() - (p_window * 10);

  insert into public.mobile_rate_limits as l (bucket_key, window_start, hit_count)
  values (p_key, now(), 1)
  on conflict (bucket_key) do update
    set window_start = case
          when l.window_start < now() - p_window then now()
          else l.window_start
        end,
        hit_count = case
          when l.window_start < now() - p_window then 1
          else l.hit_count + 1
        end
  returning hit_count into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.mobile_consume_rate_limit(text, integer, interval) from public;
-- Intentionally not granted to anon or authenticated. Callers are other
-- security-definer functions, which run with the definer's rights.

-- ---------------------------------------------------------------------------
-- Rewarded ads
-- ---------------------------------------------------------------------------

create table if not exists public.reward_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in (
    'single_watermark_free_export',
    'single_premium_template',
    'single_hd_export'
  )),
  platform text not null check (platform in ('ios', 'android')),
  ad_unit_id text not null,
  context jsonb not null default '{}'::jsonb,
  nonce text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'granted', 'rejected', 'expired')),
  rejected_reason text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reward_intents enable row level security;

drop policy if exists reward_intents_owner_read on public.reward_intents;
create policy reward_intents_owner_read on public.reward_intents
  for select to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policy: only the Edge Function (service_role) and
-- the security-definer status RPC may change rewarded state.

create index if not exists reward_intents_user_status_idx
  on public.reward_intents (user_id, status);
create index if not exists reward_intents_expires_at_idx
  on public.reward_intents (expires_at);

drop trigger if exists reward_intents_touch on public.reward_intents;
create trigger reward_intents_touch
  before update on public.reward_intents
  for each row execute function public.mobile_touch_updated_at();

create table if not exists public.reward_receipts (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null unique references public.reward_intents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  context jsonb not null default '{}'::jsonb,
  admob_transaction_id text not null unique,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_invitation_id uuid
);

alter table public.reward_receipts enable row level security;

drop policy if exists reward_receipts_owner_read on public.reward_receipts;
create policy reward_receipts_owner_read on public.reward_receipts
  for select to authenticated
  using (user_id = auth.uid());

create index if not exists reward_receipts_user_unconsumed_idx
  on public.reward_receipts (user_id, feature)
  where consumed_at is null;

-- ---------------------------------------------------------------------------
-- Upload tickets
-- ---------------------------------------------------------------------------
-- The ticket identifier the client holds is never stored. Only its SHA-256
-- hash is persisted, so a leaked table dump cannot be replayed as a ticket.

create table if not exists public.upload_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_hash text not null unique,
  scope text not null check (scope in ('owner_media', 'guest_media', 'invitation_image')),
  user_id uuid references auth.users (id) on delete cascade,
  invitation_id uuid,
  media_id uuid,
  qr_code text,
  bucket_id text not null,
  object_path text not null,
  kind text not null check (kind in ('image', 'video')),
  expected_mime text not null,
  max_bytes bigint not null check (max_bytes > 0),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint upload_tickets_owner_scope_requires_user
    check (scope = 'guest_media' or user_id is not null)
);

alter table public.upload_tickets enable row level security;
-- No policies. Tickets are issued and consumed only by Edge Functions.

create index if not exists upload_tickets_expires_at_idx
  on public.upload_tickets (expires_at)
  where completed_at is null;
create index if not exists upload_tickets_user_idx
  on public.upload_tickets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Account deletion
-- ---------------------------------------------------------------------------

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  note text
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_owner_read on public.account_deletion_requests;
create policy account_deletion_requests_owner_read on public.account_deletion_requests
  for select to authenticated
  using (user_id = auth.uid());

-- One open request per user makes the Edge Function idempotent.
create unique index if not exists account_deletion_requests_open_unique
  on public.account_deletion_requests (user_id)
  where status in ('pending', 'processing');

-- ---------------------------------------------------------------------------
-- Additive columns on legacy media tables
-- ---------------------------------------------------------------------------
-- The legacy web client stored a rendered `storage_url`. The mobile contract
-- delivers short-lived signed URLs instead, which requires the object path.
-- Existing rows keep working: the backfill below derives the path from the
-- legacy URL when it points at the qr-media bucket, and leaves it null
-- otherwise so nothing is guessed.

alter table public.media
  add column if not exists storage_path text;

alter table public.guest_uploads
  add column if not exists storage_path text,
  add column if not exists status text not null default 'active',
  add column if not exists consent_at timestamptz;

update public.media
set storage_path = substring(storage_url from '/object/(?:public|sign)/qr-media/([^?]+)')
where storage_path is null
  and storage_url is not null
  and storage_url like '%/qr-media/%';

update public.guest_uploads
set storage_path = substring(storage_url from '/object/(?:public|sign)/qr-media/([^?]+)')
where storage_path is null
  and storage_url is not null
  and storage_url like '%/qr-media/%';

create index if not exists media_qr_code_idx on public.media (qr_code);
create index if not exists guest_uploads_media_id_idx on public.guest_uploads (media_id, created_at desc);

commit;
