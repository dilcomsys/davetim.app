-- Release metadata the client reads to decide whether to prompt for an update.
--
-- Kept in the database rather than fetched from the store listings because the
-- two stores answer different questions in different shapes, and neither can
-- express "this build may no longer be used". A row here lets an operator stop
-- an unsupported build from talking to the backend without shipping anything.
--
-- Read-only to everyone, including anonymous callers: the app checks this
-- before the user signs in. It holds no personal data — a version string, a
-- store URL, and release notes written for users.

begin;

create table if not exists public.app_releases (
  platform text primary key check (platform in ('ios', 'android')),
  latest_version text not null,
  -- Builds older than this are refused a dismissible prompt and shown a
  -- blocking one. Leave it at the oldest version you still support; setting it
  -- equal to latest_version forces every user to update immediately.
  min_supported_version text not null,
  store_url text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.app_releases enable row level security;

drop policy if exists app_releases_public_read on public.app_releases;
create policy app_releases_public_read on public.app_releases
  for select using (true);

-- Writes stay with an operator holding a secret key; there is no client path.
revoke insert, update, delete on public.app_releases from anon, authenticated;

-- Seed both platforms at the shipping version so the client's first read is a
-- well-formed row that asks for nothing. `min_supported_version` equal to the
-- current version would force an update, so it deliberately starts lower.
insert into public.app_releases (platform, latest_version, min_supported_version, store_url, notes)
values
  ('ios', '1.0.0', '1.0.0', null, null),
  ('android', '1.0.0', '1.0.0', null, null)
on conflict (platform) do nothing;

commit;
