-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- WHY
-- Client briefs are moving to a different submission model. Instead of paying a
-- credit and uploading audio to Sonant, a verified composer is sent to a Disco
-- inbox and delivers the track there. Sonant keeps a lightweight record of who
-- went where and when, so the admin queue still shows engagement, but Sonant
-- never holds the file.
--
-- Nothing here changes existing rows in a way the current site would notice.
-- Every column is added with a default or as nullable, so the running site
-- keeps working whether or not the matching code has shipped yet.
--
-- SAFETY
-- All statements are additive: new columns and one check constraint. No data is
-- deleted or rewritten. As of 2026-08-28 there were 7 submissions (all uploads,
-- all against catalog briefs) and 33 briefs, so the backfills below are exact
-- rather than approximate.


-- ---------------------------------------------------------------------------
-- 1. How was this submission delivered?
-- ---------------------------------------------------------------------------
-- 'upload' means the composer sent audio through Sonant and we have the file.
-- 'disco'  means we sent them to a Disco inbox and the file lives there.
--
-- The default backfills all 7 existing rows as 'upload', which is correct:
-- every submission to date came through the uploader.

alter table public.submissions
  add column if not exists delivery text not null default 'upload';

alter table public.submissions
  add constraint submissions_delivery_check
  check (delivery in ('upload', 'disco'));


-- ---------------------------------------------------------------------------
-- 2. Which inbox was this composer actually sent to?
-- ---------------------------------------------------------------------------
-- Recorded at the moment they click through, rather than looked up later. If
-- you change a brief's inbox next month, old records still show where that
-- composer was really sent, so you can find their delivery.

alter table public.submissions
  add column if not exists disco_inbox_url text;


-- ---------------------------------------------------------------------------
-- 3. Did the track actually turn up?
-- ---------------------------------------------------------------------------
-- Clicking through to Disco is a statement of intent, not proof of delivery.
-- Someone can click and never send anything. You set this in admin once you
-- see the file land in Disco, which is what lets you tell the difference
-- between "5 people are working on this" and "5 people opened a tab".

alter table public.submissions
  add column if not exists delivery_confirmed_at timestamptz;


-- ---------------------------------------------------------------------------
-- 4. A per-brief Disco inbox
-- ---------------------------------------------------------------------------
-- Without this, every client brief shares one inbox and the Army deliveries
-- arrive mixed in with the next job's. With it, each brief can have its own,
-- and deliveries arrive pre-sorted.
--
-- Left null, the app falls back to the DISCO_INBOX_URL environment variable,
-- so you can set this per brief only when you want to.
--
-- Note this is deliberately NOT the existing disco_playlist_id column, which
-- means "the public catalog playlist to embed" and is null on all 33 briefs.
-- Different purpose, and reusing it would be confusing later.

alter table public.briefs
  add column if not exists disco_inbox_url text;


-- ---------------------------------------------------------------------------
-- 5. Granting the verified badge by hand
-- ---------------------------------------------------------------------------
-- Verification is currently computed on the fly as "3 or more accepted
-- submissions" and there is no way to override it. Today that admits exactly
-- one account (music@lukedespain.com).
--
-- This column is deliberately three-state:
--   null   -> use the automatic rule, whatever it says. This is the default,
--             so every one of the 29 existing profiles keeps behaving exactly
--             as it does now.
--   true   -> always verified, regardless of accepted count. For composers you
--             already trust and do not want to make wait.
--   false  -> never verified, even at 3+ accepted. For revoking access without
--             having to un-accept their past work.

alter table public.profiles
  add column if not exists verified_override boolean;


-- ---------------------------------------------------------------------------
-- 6. CHECK, NOT A CHANGE: does anything block repeat submissions?
-- ---------------------------------------------------------------------------
-- The new client flow lets a verified composer deliver to the same brief as
-- many times as they like. That only works if there is no unique constraint on
-- (user_id, brief_id). The evidence says there isn't one -- the uploader
-- already tells composers "You've already submitted to this brief. This will be
-- reviewed as a separate entry" -- but that could not be confirmed read-only,
-- so confirm it here rather than assume.
--
-- Expect: a primary key on id, a couple of foreign keys, and the delivery check
-- added above. If you see a unique constraint or unique index covering
-- user_id together with brief_id, tell me and it needs dropping.

select conname as constraint_name, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.submissions'::regclass
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'submissions'
order by indexname;
