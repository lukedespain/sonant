'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { RosterComposer, RosterTrack } from '@/lib/roster';
import TagPicker from '@/components/TagPicker';
import { StatusPill, btn, inputClass } from '@/components/ui';

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

function TrackRow({
  track,
  playingId,
  onToggle,
  onTagsSaved,
}: {
  track: RosterTrack;
  playingId: string | null;
  onToggle: (t: RosterTrack) => void;
  onTagsSaved: (submissionId: string, tags: { genres: string[]; moods: string[] }) => void;
}) {
  const playing = playingId === track.submissionId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ genres: track.genres, moods: track.moods });
  const [state, setState] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setState('saving');
    setError(null);
    const res = await fetch('/api/admin/roster/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: track.submissionId, ...draft }),
    });
    const json = await res.json().catch(() => ({}));
    setState('idle');
    if (!res.ok) return setError((json as { error?: string }).error ?? 'Could not save.');
    onTagsSaved(track.submissionId, (json as { tags: { genres: string[]; moods: string[] } }).tags);
    setEditing(false);
  }

  return (
    <li className="py-3 border-t border-[var(--border-base)]">
      <div className="grid grid-cols-[36px_1fr] md:grid-cols-[36px_1.2fr_1fr_auto] gap-x-4 gap-y-1 items-center">
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
        <div className="col-start-2 md:col-start-auto min-w-0">
          <p className="text-[13px] text-[var(--text-secondary)] truncate">
            {[...track.genres, ...track.moods].join(' · ') || 'No tags'}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft({ genres: track.genres, moods: track.moods });
              setEditing((v) => !v);
            }}
            className={`text-[12px] hover:text-[var(--text-primary)] ${track.tagged ? 'text-[var(--text-dimmer)]' : 'text-[var(--signal)]'}`}
          >
            {editing ? 'Cancel' : track.tagged ? 'Edit tags' : 'From the brief · tag it'}
          </button>
        </div>
        <p className="col-start-2 md:col-start-auto text-[13px] text-[var(--text-dimmer)] whitespace-nowrap tabular-nums">
          {formatDate(track.placedAt)}
          {track.kind === 'catalog' && !track.signedOn && <span className="ml-2 text-[var(--signal)]">Not signed on</span>}
        </p>
      </div>
      {editing && (
        <div className="mt-4 md:ml-[52px] p-4 border border-[var(--border-card)] rounded-xl">
          <TagPicker
            genreOptions={track.briefGenres}
            moodOptions={track.briefMoods}
            value={draft}
            onChange={setDraft}
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={state === 'saving'}
              className="h-8 px-3 text-sm bg-[var(--text-primary)] text-[var(--bg-base)] rounded-xl disabled:opacity-50"
            >
              {state === 'saving' ? 'Saving…' : 'Save tags'}
            </button>
            {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
          </div>
        </div>
      )}
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
        className="mt-2 w-full px-3 py-2.5 text-sm bg-[var(--bg-card-deep)] border border-[var(--border-card)] rounded-xl focus:border-[var(--text-primary)] focus:outline-none"
      />
      {(dirty || state === 'error') && (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={state === 'saving'}
            className="h-8 px-3 text-sm bg-[var(--text-primary)] text-[var(--bg-base)] rounded-xl disabled:opacity-50"
          >
            {state === 'saving' ? 'Saving…' : 'Save note'}
          </button>
          {state === 'error' && <span className="text-sm text-[var(--danger)]">Could not save. Try again.</span>}
        </div>
      )}
    </div>
  );
}

export default function RosterView({ composers: initial }: { composers: RosterComposer[] }) {
  const [composers, setComposers] = useState(initial);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'placed' | 'unplaced' | 'all'>('placed');
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
      if (status === 'placed' && !c.placed) return false;
      if (status === 'unplaced' && c.placed) return false;
      if (q && !`${c.name} ${c.email} ${c.note}`.toLowerCase().includes(q)) return false;
      const g = new Set(c.tracks.flatMap((t) => t.genres));
      const m = new Set(c.tracks.flatMap((t) => t.moods));
      return genres.every((x) => g.has(x)) && moods.every((x) => m.has(x));
    });
  }, [composers, query, genres, moods, status]);
  const placedCount = composers.filter((c) => c.placed).length;

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

  function updateTrackTags(composerId: string, submissionId: string, tags: { genres: string[]; moods: string[] }) {
    setComposers((list) =>
      list.map((c) =>
        c.id !== composerId
          ? c
          : {
              ...c,
              tracks: c.tracks.map((t) => (t.submissionId === submissionId ? { ...t, ...tags, tagged: true } : t)),
            },
      ),
    );
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
      <div className="space-y-5 mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or note"
          className={inputClass}
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

      <div className="inline-flex items-center gap-1 p-1 mb-4 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)]">
        {(
          [
            ['placed', 'On the roster', placedCount],
            ['unplaced', 'Not placed yet', composers.length - placedCount],
            ['all', 'Everyone', composers.length],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            aria-pressed={status === id}
            className={`h-8 px-3.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors ${
              status === id ? 'bg-[var(--accent)] text-[#0A0A0A] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
            <span className={`tabular-nums ${status === id ? 'text-[#0A0A0A]/55' : 'text-[var(--text-dimmer)]'}`}>{n}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
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
            className={btn('secondary', 'sm')}
          >
            {copied ? 'Copied' : `Copy ${filtered.length} ${filtered.length === 1 ? 'email' : 'emails'}`}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 text-center text-[14px] text-[var(--text-muted)]">
          {status === 'placed' && placedCount === 0
            ? 'No placements yet. Composers join the roster once a catalogue track is accepted.'
            : 'Nobody matches that. Try fewer tags or another tab.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((c) => {
            const placements = c.tracks.length + c.outsidePlacements;
            if (!c.placed) {
              return (
                <li key={c.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate">{c.name}</p>
                    <a href={`mailto:${c.email}`} className="block text-[12px] text-[var(--text-dim)] hover:text-[var(--text-primary)] truncate">
                      {c.email}
                    </a>
                  </div>
                  <span className="text-[12px] text-[var(--text-dim)] tabular-nums">
                    {c.submissionCount} {c.submissionCount === 1 ? 'submission' : 'submissions'}
                  </span>
                  <span className="text-[12px] text-[var(--text-dim)] tabular-nums">Joined {formatDate(c.joinedAt) || 'n/a'}</span>
                  <StatusPill tone="muted">Not placed</StatusPill>
                </li>
              );
            }
            const topGenres = composerTags(c, 'genres').slice(0, 6);
            const topMoods = composerTags(c, 'moods').slice(0, 6);
            return (
              <li key={c.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 md:p-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-8 lg:gap-12">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-[20px] md:text-[22px] font-semibold tracking-[-0.025em] leading-tight">{c.name}</p>
                    <StatusPill tone="positive">
                      {placements} {placements === 1 ? 'placement' : 'placements'}
                    </StatusPill>
                  </div>
                  <a href={`mailto:${c.email}`} className="block mt-1 text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] truncate">
                    {c.email}
                  </a>
                  <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                    <div>
                      <dt className="text-[var(--text-dimmer)]">Placements</dt>
                      <dd className="mt-0.5 text-[14px] tabular-nums">
                        {placements}
                        {c.outsidePlacements > 0 && (
                          <span className="text-[var(--text-muted)] text-[13px]"> ({c.outsidePlacements} outside)</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">Last placed</dt>
                      <dd className="mt-0.5 text-[14px]">{formatDate(c.lastPlacedAt) || 'n/a'}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">PRO</dt>
                      <dd className="mt-0.5 text-[14px]">{c.rights.pro || 'Not given'}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-dimmer)]">IPI</dt>
                      <dd className="mt-0.5 text-[14px] tabular-nums">{c.rights.composerIpi || 'Not given'}</dd>
                    </div>
                    {c.rights.publisherName && (
                      <div className="col-span-2">
                        <dt className="text-[var(--text-dimmer)]">Publisher</dt>
                        <dd className="mt-0.5 text-[14px]">
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
                    <p className="text-[13px] text-[var(--text-dimmer)] mb-2">
                      Verified for
                      {c.tracks.some((t) => !t.tagged) && ' · some tags still come from the brief'}
                    </p>
                  )}
                  {(topGenres.length > 0 || topMoods.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {topGenres.map((g) => (
                        <span key={g} className="text-[12px] h-6 px-2.5 inline-flex items-center bg-[var(--accent-soft)] text-[var(--text-secondary)] rounded-full">{g}</span>
                      ))}
                      {topMoods.map((m) => (
                        <span key={m} className="text-[12px] h-6 px-2.5 inline-flex items-center border border-[var(--border-card)] text-[var(--text-muted)] rounded-full">{m}</span>
                      ))}
                    </div>
                  )}
                  {c.tracks.length > 0 ? (
                    <ul className="border-b border-[var(--border-base)]">
                      {c.tracks.map((t) => (
                        <TrackRow
                          key={t.submissionId}
                          track={t}
                          playingId={playingId}
                          onToggle={togglePlay}
                          onTagsSaved={(id, tags) => updateTrackTags(c.id, id, tags)}
                        />
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
