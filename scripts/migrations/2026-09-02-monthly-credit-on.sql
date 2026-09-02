-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- WHY
-- Every composer gets one free submission credit on the calendar day they
-- signed up, each month. This column records the last anniversary we granted
-- so we do not double-pay, and so the profile can show days until the next one.
--
-- SAFETY
-- Additive only. The app also stores the same date on auth user_metadata, so
-- grants still work before this column exists.

alter table public.profiles
  add column if not exists monthly_credit_on date;
