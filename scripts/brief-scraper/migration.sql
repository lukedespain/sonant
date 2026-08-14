-- Run in Supabase SQL editor (Database > SQL Editor)
-- Creates the brief_corpus table for storing scraped + extracted sync briefs

CREATE TABLE IF NOT EXISTS brief_corpus (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  source          TEXT        NOT NULL,                           -- 'reddit', 'music_gateway', etc.
  source_url      TEXT        UNIQUE NOT NULL,                    -- deduplication key
  raw_text        TEXT        NOT NULL,
  extracted_fields JSONB,                                         -- { mood, genre, tempo, scene_context, music_ask, instrumentation_notes }
  mode            TEXT        CHECK (mode IN ('brand', 'film', 'games', 'tv', 'other')),
  quality_score   INTEGER     CHECK (quality_score BETWEEN 1 AND 5),
  curated         BOOLEAN     NOT NULL DEFAULT FALSE,             -- manually reviewed
  approved        BOOLEAN     NOT NULL DEFAULT FALSE,             -- approved for few-shot injection
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the generator query pattern (fetch approved examples by mode)
CREATE INDEX IF NOT EXISTS idx_brief_corpus_approved ON brief_corpus (approved);
CREATE INDEX IF NOT EXISTS idx_brief_corpus_mode     ON brief_corpus (mode);

-- RLS: table is admin-only (accessed via service role key in the scraper)
ALTER TABLE brief_corpus ENABLE ROW LEVEL SECURITY;

-- No public read policy — generator reads via service role on the server
