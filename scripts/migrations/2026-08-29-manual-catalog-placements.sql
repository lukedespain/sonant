-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- WHY
-- Verification counts accepted catalog submissions. Sometimes a placement
-- happened off-platform (an email, a Disco drop, a conversation) and there is
-- no submission row to accept. This column lets you add those by hand so the
-- 1/3, 2/3, 3/3 counter and the verified-composer gate stay honest.
--
-- SAFETY
-- Additive only. Default 0 means every existing profile keeps the same count
-- it has today until you change one.

alter table public.profiles
  add column if not exists manual_catalog_placements integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_manual_catalog_placements_nonnegative;

alter table public.profiles
  add constraint profiles_manual_catalog_placements_nonnegative
  check (manual_catalog_placements >= 0);
