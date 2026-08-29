-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- WHY
-- Two confirms for the same uploaded file can both look for an existing row,
-- both find nothing, and both insert. That leaves two community_tracks rows
-- pointing at one audio file, and deleting either one removes the file out
-- from under the other, so the surviving row plays nothing.
--
-- This tells Postgres that one stored file may be claimed by at most one row.
-- The second insert then fails with error 23505, which the confirm route
-- already treats as "somebody else got there first, that is fine".
--
-- SAFETY
-- The first statement is a check, not a change: it lists any duplicates that
-- already exist. As of 2026-08-28 there were two community tracks in total and
-- no duplicates, so this should return no rows. If it does return rows, delete
-- the extras before running the second statement, or it will fail.

-- 1. Check for existing duplicates (expect: no rows).
select storage_path, count(*)
from public.community_tracks
group by storage_path
having count(*) > 1;

-- 2. Add the constraint.
alter table public.community_tracks
  add constraint community_tracks_storage_path_key unique (storage_path);


-- ---------------------------------------------------------------------------
-- RECOMMENDED, BUT NOT REQUIRED BY ANY CODE CHANGE
-- ---------------------------------------------------------------------------
-- Right now anyone holding the public anon key can ask Supabase for a listing
-- of the community-tracks bucket and get back every brief folder and every
-- file name in it. Nothing in Sonant needs that: the app lists objects with the
-- service role key, and playback of a public bucket works over the public URL
-- with no credentials at all (verified 2026-08-28 by fetching a track's URL
-- with no apikey and no Authorization header and getting a 200).
--
-- Removing the policy stops strangers enumerating who has uploaded what while
-- a brief is still unreleased. Find its name first, then drop that name.
--
-- select policyname, roles, cmd, qual
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and qual like '%community-tracks%';
--
-- drop policy "<the policyname from above>" on storage.objects;
--
-- After dropping it, re-check that a track still plays on /browse/<brief id>.


-- ---------------------------------------------------------------------------
-- OPTIONAL, NOT REQUIRED, AND NOT CALLED BY THE APPLICATION
-- ---------------------------------------------------------------------------
-- The submission credit is currently spent by reading the balance and then
-- writing it back only if it has not changed, retrying if it has. That is safe
-- against two submissions racing, but the debit and the submission row are
-- still two separate steps, so a server crash in the exact gap between them
-- could take a credit without recording a submission.
--
-- The function below closes that gap by doing both in one transaction: either
-- the credit is spent and the submission exists, or neither happened. Creating
-- it changes nothing on its own. It is only worth running if you also want the
-- follow-up code change in app/api/submissions/upload/route.ts to call it.
--
-- create or replace function public.spend_credit_and_record_submission(
--   p_submission_id uuid,
--   p_user_id uuid,
--   p_brief_id uuid,
--   p_skip_credit boolean default false
-- )
-- returns text
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--   v_updated int;
-- begin
--   if not p_skip_credit then
--     update public.profiles
--        set submission_credits = submission_credits - 1
--      where id = p_user_id
--        and submission_credits > 0;
--     get diagnostics v_updated = row_count;
--     if v_updated = 0 then
--       return 'insufficient_credit';
--     end if;
--   end if;
--
--   -- If another request already recorded this exact submission, this raises a
--   -- unique violation and the whole function is rolled back, including the
--   -- debit above, so a duplicate can never cost a second credit.
--   insert into public.submissions (id, user_id, brief_id, status)
--   values (p_submission_id, p_user_id, p_brief_id, 'received');
--
--   return 'recorded';
-- end;
-- $$;
--
-- revoke all on function public.spend_credit_and_record_submission(uuid, uuid, uuid, boolean) from public, anon, authenticated;
