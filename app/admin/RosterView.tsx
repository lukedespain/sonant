'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { RosterComposer, RosterTrack } from '@/lib/roster';

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film', games: 'Games' };

function tally(composers: RosterComposer[], key: 'genres' | 'moods') {
  const counts = new Map<string, number>();
  for (const c of composers) for (const t of c.tracks) for (const v of t[key]) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function composerTags(c: RosterComposer, key: 'genres' | 'moods') {
  const counts = new Map<string, number>();
  for (const t of c.tracks) for (const v of t[key]) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Chip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 px-3 text-sm border rounded-full transition-colors ${
        active
          ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
      }`}
    >
      {label}
      {count !== undefined && <span className={`ml-1.5 tabular-nums ${active ? 'opacity-60' : 'text-[var(--text-dimmer)]'}`}>{count}</span>}
    </button>
  );
}

function TrackRow({ track, playingId, onToggle }: { track: RosterTrack; playingId: string | null; onToggle: (t: RosterTrack) => void }) {
  const playing = playingId === track.submissionId;
  return (
    <li className="grid grid-cols-[36px_1fr] md:grid-cols-[36px_1.2fr_1fr_auto] gap-x-4 gap-y-1 items-center py-3 border-t border-[var(--border-base)]">
      <button
        type="button"
        disabled={!track.audioUrl}
        onClick={() => onToggle(track)}
        aria-label={playing ? `Pause ${track.trackName}` : `Play ${track.trackName}`}
        className="w-9 h-9 rounded-full border border-[var(--border-subtle)] flex items-center justify-center hover:border-[var(--text-primary)] disabled:opacity-30"
      >
        {playing ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" /></svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor" /></svg>
        )}
      </button>
      <div className="min-w-0">
        <p className="text-[15px] truncate">{track.trackName}</p>
        <p className="text-[13px] text-[var(--text-muted)] truncate">
          <Link href={`/briefs/${track.briefId}`} className="hover:text-[var(--text-primary)]">{track.briefTitle}</Link>
          {' · '}
          {track.catalogName}
        </p>
      </div>
      <p className="col-start-2 md:col-start-auto text-[13px] text-[var(--text-muted)] truncate">
        {[MODE_LABELS[track.mode], ...track.genres.slice(0, 2), ...track.moods.slice(0, 2)].filter(Boolean).join(' · ')}
      </p>
      <p className="col-start-2 md:col-start-auto text-[13px] text-[var(--text-dimmer)] whitespace-nowrap tabular-nums">
        {formatDate(track.placedAt)}
        {track.kind === 'catalog' && !track.signedOn && <span className="ml-2 text-[var(--signal)]">Not signed on</span>}
      </p>
    </li>
  );
}

function NoteField({ composer }: { composer: RosterComposer }) {
  const [note, setNote] = useState(composer.note);
  const [saved, setSaved] = useState(composer.note);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const dirty = note !== saved;

  async function save() {
    setState('saving');
    const res = await fetch('/api/admin/roster/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: composer.id, note }),
    });
    if (!res.ok) return setState('error');
    setSaved(note);
    setState('idle');
  }

  return (
    <div className="mt-5">
      <label htmlFor={`note-${composer.id}`} className="text-[13px] text-[var(--text-muted)]">
        Private note
      </label>
      <textarea
        id={`note-${composer.id}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Fast turnaround, great with orchestral builds, wants more brand work…"
        className="mt-2 w-full px-3 py-2.5 text-sm bg-[var(--bg-card-deep)] border border-[var(--border-card)] rounded-[2px] focus:border-[var(--text-primary)] focus:outline-none"
      />
      {(dirty || state === 'error') && (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={state === 'saving'}
            className="h-8 px-3 text-sm bg-[var(--text-primary)] text-[var(--bg-base)] rounded-[2px] disabled:opacity-50"
          >
            {state === 'saving' ? 'Saving…' : 'Save note'}
          </button>
          {state === 'error' && <span className="text-sm text-[var(--danger)]">Could not save. Try again.</span>}
        </div>
      )}
    </div>
  );
}

export default function RosterView({ composers }: { composers: RosterComposer[] }) {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const genreTally = useMemo(() => tally(composers, 'genres'), [composers]);
  const moodTally = useMemo(() => tally(composers, 'moods'), [composers]);
  const tagLimit = showAllTags ? Infinity : 14;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return composers.filter((c) => {
      if (q && !`${c.name} ${c.email} ${c.note}`.toLowerCase().includes(q)) return false;
      const g = new Set(c.tracks.flatMap((t) => t.genres));
      const m = new Set(c.tracks.flatMap((t) => t.moods));
      return genres.every((x) => g.has(x)) && moods.every((x) => m.has(x));
    });
  }, [composers, query, genres, moods]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  function togglePlay(track: RosterTrack) {
    if (!track.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setPlayingId(null));
    }
    const audio = audioRef.current;
    if (playingId === track.submissionId) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = track.audioUrl;
    void audio.play();
    setPlayingId(track.submissionId);
  }

  async function copyEmails() {
    const emails = filtered.map((c) => c.email).filter(Boolean).join(', ');
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy these emails', emails);
    }
  }

  const filtering = genres.length > 0 || moods.length > 0 || query.trim().length > 0;

  return (
    <div>
      <p className="text-[17px] text-[var(--text-muted)] leading-relaxed max-w-2xl mb-10">
        Every composer with a track accepted into the catalogue or placed on a client job. Genres and moods come from the briefs they wrote to. Pick tags to find who fits a new job, then copy their emails.
      </p>

      <div className="space-y-5 mb-10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or note"
          className="w-full h-11 px-4 text-[15px] bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[2px] focus:border-[var(--text-primary)] focus:outline-none"
        />
        {genreTally.length > 0 && (
          <div>
            <p className="text-[13px] text-[var(--text-muted)] mb-2.5">Genre</p>
            <div className="flex flex-wrap gap-2">
              {genreTally.slice(0, tagLimit).map(([g, n]) => (
                <Chip key={g} label={g} count={n} active={genres.includes(g)} onClick={() => toggle(genres, setGenres, g)} />
              ))}
            </div>
          </div>
        )}
        {moodTally.length > 0 && (
          <div>
            <p className="text-[13px] text-[var(--text-muted)] mb-2.5">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moodTally.slice(0, tagLimit).map(([m, n]) => (
                <Chip key={m} label={m} count={n} active={moods.includes(m)} onClick={() => toggle(moods, setMoods, m)} />
              ))}
            </div>
          </div>
        )}
        {(genreTally.length > 14 || moodTally.length > 14) && (
          <button type="button" onClick={() => setShowAllTags((v) => !v)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {showAllTags ? 'Show fewer tags' : 'Show all tags'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <p className="text-[15px]">
          <span className="tabular-nums">{filtered.length}</span>{' '}
          <span className="text-[var(--text-muted)]">
            {filtered.length === 1 ? 'composer' : 'composers'}
            {filtering && ` of ${composers.length}`}
          </span>
        </p>
        <div className="flex items-center gap-4">
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setGenres([]);
                setMoods([]);
                setQuery('');
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={copyEmails}
            disabled={filtered.length === 0}
            className="h-9 px-4 text-sm border border-[var(--border-subtle)] rounded-[2px] hover:border-[var(--text-primary)] disabled:opacity-40"
          >
            {copied ? 'Copied' : `Copy ${filtered.length} ${filtered.length === 1 ? 'email' : 'emails'}`}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-[17px] text-[var(--text-muted)]">
          {composers.length === 0 ? 'No placements yet. Composers show up here once a track is accepted.' : 'Nobody matches all of those tags. Try fewer.'}
        </p>
      ) : (
        <ul>
          {filtered.map((c) => {
            const placements = c.tracks.length + c.outsidePlacements;
            const topGenres = composerTags(c, 'genres').slice(0, 6);
            const topMoods = composerTags(c, 'moods').slice(0, 6);
            return (
              <li key={c.id} className="py-10 border-b border-[var(--border-card)] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-8 lg:gap-14">
                <div className="min-w-0">
                  <p className="text-[26px] md:text-[30px] font-medium tracking-[-0.03em] leading-tight">{c.name}</p>
                  <a href={`mailto:${c.email}`} className="block mt-1 text-[15px] text-[var(--text-muted)] hover:text-[var(--text-primary)] truncate">
                    {c.email}
                  </a>
                  <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                    <div>
                      <dt className="text-[var(--text-dimmer)]">Placements</dt>
                      <dd className="mt-0.5 text-[15px] tabular-nums">
                        {placements}
                        {c.outsidePlacements > 0 && (
                          <span className="text-[var(--text-muted)] text-[13px]"> ({c.outsidePlacements} outside)</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">Last placed</dt>
                      <dd className="mt-0.5 text-[15px]">{formatDate(c.lastPlacedAt) || 'n/a'}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">PRO</dt>
                      <dd className="mt-0.5 text-[15px]">{c.rights.pro || 'Not given'}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">IPI</dt>
                      <dd className="mt-0.5 text-[15px] tabular-nums">{c.rights.composerIpi || 'Not given'}</dd>
                    </div>
                    {c.rights.publisherName && (
                      <div className="col-span-2">
                        <dt className="text-[var(--text-dimmer)]">Publisher</dt>
                        <dd className="mt-0.5 text-[15px]">
                          {c.rights.publisherName}
                          {c.rights.publisherIpi && <span className="text-[var(--text-muted)]"> · IPI {c.rights.publisherIpi}</span>}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <NoteField composer={c} />
                </div>

                <div className="min-w-0">
                  {(topGenres.length > 0 || topMoods.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {topGenres.map((g) => (
                        <span key={g} className="text-[13px] px-2.5 py-1 bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-full">{g}</span>
                      ))}
                      {topMoods.map((m) => (
                        <span key={m} className="text-[13px] px-2.5 py-1 border border-[var(--border-card)] text-[var(--text-muted)] rounded-full">{m}</span>
                      ))}
                    </div>
                  )}
                  {c.tracks.length > 0 ? (
                    <ul className="border-b border-[var(--border-base)]">
                      {c.tracks.map((t) => (
                        <TrackRow key={t.submissionId} track={t} playingId={playingId} onToggle={togglePlay} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">Placed outside the portal. No tracks on file here.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
