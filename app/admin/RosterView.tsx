'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { RosterComposer, RosterTrack } from '@/lib/roster';
import TagPicker from '@/components/TagPicker';
import FilterMenu from '@/components/FilterMenu';
import { StatusPill, btn, textareaClass } from '@/components/ui';
import { IconSearch } from '@/components/shell/icons';
import { norm, titleCase } from '@/lib/sound';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Tags across a composer's tracks, most used first. */
function topTags(c: RosterComposer, key: 'genres' | 'moods') {
  const counts = new Map<string, { label: string; n: number }>();
  for (const t of c.tracks) {
    for (const v of t[key]) {
      const k = norm(v);
      counts.set(k, { label: counts.get(k)?.label ?? titleCase(v), n: (counts.get(k)?.n ?? 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).map((x) => x.label);
}

function tally(composers: RosterComposer[], key: 'genres' | 'moods') {
  const counts = new Map<string, { label: string; n: number }>();
  for (const c of composers) {
    const seen = new Set<string>();
    for (const t of c.tracks)
      for (const v of t[key]) {
        const k = norm(v);
        if (seen.has(k)) continue;
        seen.add(k);
        counts.set(k, { label: counts.get(k)?.label ?? titleCase(v), n: (counts.get(k)?.n ?? 0) + 1 });
      }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

const needsTags = (c: RosterComposer) => c.tracks.filter((t) => !t.tagged).length;
const awaitingSignature = (c: RosterComposer) => c.tracks.filter((t) => t.kind === 'catalog' && !t.signedOn).length;

function TrackRow({
  track,
  playing,
  onToggle,
  onTagsSaved,
}: {
  track: RosterTrack;
  playing: boolean;
  onToggle: () => void;
  onTagsSaved: (tags: { genres: string[]; moods: string[] }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ genres: track.genres, moods: track.moods });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/roster/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: track.submissionId, ...draft }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; tags?: { genres: string[]; moods: string[] } };
    setSaving(false);
    if (!res.ok || !json.tags) {
      setError(json.error ?? 'Could not save.');
      return;
    }
    onTagsSaved(json.tags);
    setEditing(false);
  }

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={!track.audioUrl}
          onClick={onToggle}
          aria-label={playing ? `Pause ${track.trackName}` : `Play ${track.trackName}`}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 transition-colors ${
            playing ? 'bg-[var(--signal)] text-[#0A0A0A]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
          }`}
        >
          {playing ? (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" /></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium truncate">{track.trackName}</p>
          <p className="text-[12px] text-[var(--text-dim)] truncate">
            <Link href={`/briefs/${track.briefId}`} className="hover:text-[var(--text-primary)]">
              {track.briefTitle}
            </Link>{' '}
            · {formatDate(track.placedAt)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {track.tagged ? (
              [...track.genres, ...track.moods].slice(0, 5).map((t) => (
                <span key={t} className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent-soft)] text-[12px] text-[var(--text-secondary)]">
                  {titleCase(t)}
                </span>
              ))
            ) : (
              <button type="button" onClick={() => setEditing(true)} aria-label="Tag this track">
                <StatusPill tone="warning">Needs tags</StatusPill>
              </button>
            )}
            {track.kind === 'catalog' && !track.signedOn && <StatusPill tone="signal">Awaiting signature</StatusPill>}
            {track.tagged && (
              <button
                type="button"
                onClick={() => {
                  setDraft({ genres: track.genres, moods: track.moods });
                  setEditing((v) => !v);
                }}
                className="ml-1 text-[12px] text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
        </div>
      </div>
      {editing && (
        <div className="mt-3 ml-12 p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-base)]">
          <TagPicker genreOptions={track.briefGenres} moodOptions={track.briefMoods} value={draft} onChange={setDraft} />
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={save} disabled={saving} className={btn('primary', 'sm')}>
              {saving ? 'Saving…' : 'Save tags'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={btn('ghost', 'sm')}>
              Cancel
            </button>
            {error && <span className="text-[12px] text-[var(--danger)]">{error}</span>}
          </div>
        </div>
      )}
    </li>
  );
}

function NoteField({ composer, onSaved }: { composer: RosterComposer; onSaved: (note: string) => void }) {
  const [note, setNote] = useState(composer.note);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const dirty = note !== composer.note;

  async function save() {
    setState('saving');
    const res = await fetch('/api/admin/roster/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: composer.id, note }),
    });
    if (!res.ok) {
      setState('error');
      return;
    }
    onSaved(note);
    setState('idle');
  }

  return (
    <div>
      <label htmlFor={`note-${composer.id}`} className="block text-[12px] text-[var(--text-dim)] mb-1.5">
        Private note
      </label>
      <textarea
        id={`note-${composer.id}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Fast turnaround, great with orchestral builds…"
        className={textareaClass}
      />
      {(dirty || state === 'error') && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={save} disabled={state === 'saving'} className={btn('primary', 'sm')}>
            {state === 'saving' ? 'Saving…' : 'Save note'}
          </button>
          {state === 'error' && <span className="text-[12px] text-[var(--danger)]">Could not save.</span>}
        </div>
      )}
    </div>
  );
}

function Detail({
  c,
  playingId,
  onTogglePlay,
  onTagsSaved,
  onNoteSaved,
}: {
  c: RosterComposer;
  playingId: string | null;
  onTogglePlay: (t: RosterTrack) => void;
  onTagsSaved: (submissionId: string, tags: { genres: string[]; moods: string[] }) => void;
  onNoteSaved: (note: string) => void;
}) {
  const placements = c.tracks.length + c.outsidePlacements;
  const rights: [string, string][] = [
    ['PRO', c.rights.pro || 'Not given'],
    ['IPI', c.rights.composerIpi || 'Not given'],
    ['Publisher', c.rights.publisherName ? `${c.rights.publisherName}${c.rights.publisherIpi ? ` · ${c.rights.publisherIpi}` : ''}` : 'None'],
  ];
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 flex flex-col gap-5 animate-rise">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[19px] font-semibold tracking-[-0.02em] leading-tight">{c.name}</p>
          {c.placed ? <StatusPill tone="positive">{placements} placed</StatusPill> : <StatusPill tone="muted">Not placed</StatusPill>}
        </div>
        <a href={`mailto:${c.email}`} className="mt-1 block text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] break-all">
          {c.email}
        </a>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-3">
        {rights.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] text-[var(--text-dim)]">{k}</dt>
            <dd className="text-[13px] truncate tabular-nums" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {c.tracks.length > 0 ? (
        <div>
          <p className="text-[12px] text-[var(--text-dim)]">Accepted tracks</p>
          <ul className="divide-y divide-[var(--border-base)]">
            {c.tracks.map((t) => (
              <TrackRow
                key={t.submissionId}
                track={t}
                playing={playingId === t.submissionId}
                onToggle={() => onTogglePlay(t)}
                onTagsSaved={(tags) => onTagsSaved(t.submissionId, tags)}
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--text-muted)]">
          {c.outsidePlacements > 0
            ? 'Placed outside the portal. No tracks on file here.'
            : `${c.submissionCount} ${c.submissionCount === 1 ? 'submission' : 'submissions'}, none accepted yet.`}
        </p>
      )}

      <NoteField key={c.id} composer={c} onSaved={onNoteSaved} />

      {c.placed && (
        <Link href="/projects" className={btn('secondary', 'md', 'w-full')}>
          Invite to a project
        </Link>
      )}
    </div>
  );
}

export default function RosterView({ composers: initial }: { composers: RosterComposer[] }) {
  const [composers, setComposers] = useState(initial);
  const [status, setStatus] = useState<'placed' | 'unplaced' | 'all' | 'todo'>('placed');
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const placed = useMemo(() => composers.filter((c) => c.placed), [composers]);
  const todoTags = placed.reduce((n, c) => n + needsTags(c), 0);
  const todoSign = placed.reduce((n, c) => n + awaitingSignature(c), 0);
  const genreOptions = useMemo(() => tally(placed, 'genres'), [placed]);
  const moodOptions = useMemo(() => tally(placed, 'moods'), [placed]);

  const filtered = composers.filter((c) => {
    if (status === 'placed' && !c.placed) return false;
    if (status === 'unplaced' && c.placed) return false;
    if (status === 'todo' && needsTags(c) + awaitingSignature(c) === 0) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${c.name} ${c.email} ${c.note}`.toLowerCase().includes(q)) return false;
    const g = new Set(c.tracks.flatMap((t) => t.genres).map(norm));
    const m = new Set(c.tracks.flatMap((t) => t.moods).map(norm));
    return genres.every((x) => g.has(norm(x))) && moods.every((x) => m.has(norm(x)));
  });
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

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

  function updateComposer(id: string, fn: (c: RosterComposer) => RosterComposer) {
    setComposers((list) => list.map((c) => (c.id === id ? fn(c) : c)));
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

  const tabs = [
    ['placed', 'On the roster', placed.length],
    ['unplaced', 'Not placed yet', composers.length - placed.length],
    ['all', 'Everyone', composers.length],
  ] as const;

  return (
    <div>
      {todoTags + todoSign > 0 && (
        <button
          type="button"
          onClick={() => setStatus(status === 'todo' ? 'placed' : 'todo')}
          className="mb-5 w-full flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-3 text-left text-[14px] hover:border-[var(--border-hover)] transition-colors"
        >
          <span className="font-medium">To do</span>
          {todoTags > 0 && (
            <StatusPill tone="warning">
              {todoTags} {todoTags === 1 ? 'track needs' : 'tracks need'} tags
            </StatusPill>
          )}
          {todoSign > 0 && <StatusPill tone="signal">{todoSign} awaiting signature</StatusPill>}
          <span className="ml-auto text-[13px] text-[var(--text-muted)]">{status === 'todo' ? 'Show the roster' : 'Show them'}</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex p-1 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)]">
          {tabs.map(([id, label, n]) => (
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
        <label className="flex-1 min-w-[200px] flex items-center gap-2.5 h-10 px-3.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-input)] focus-within:border-[var(--signal-line)]">
          <IconSearch size={15} className="text-[var(--text-dim)] shrink-0" />
          <span className="sr-only">Search composers</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or note"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)]"
          />
        </label>
        <FilterMenu label="Genre" options={genreOptions} value={genres} onChange={setGenres} searchable />
        <FilterMenu label="Mood" options={moodOptions} value={moods} onChange={setMoods} searchable />
        <button type="button" onClick={copyEmails} disabled={filtered.length === 0} className={btn('secondary', 'md')}>
          {copied ? 'Copied' : `Copy ${filtered.length} ${filtered.length === 1 ? 'email' : 'emails'}`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 text-center text-[14px] text-[var(--text-muted)]">
          {status === 'placed' && placed.length === 0 ? 'Nobody is placed yet.' : 'Nobody matches that.'}
        </p>
      ) : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_80px_minmax(0,1fr)_minmax(0,1fr)_80px] gap-4 px-4 h-10 items-center border-b border-[var(--border-base)] text-[12px] text-[var(--text-dim)]">
              <span>Composer</span>
              <span>Placed</span>
              <span>Top genres</span>
              <span>Top moods</span>
              <span>Last</span>
            </div>
            <ul className="divide-y divide-[var(--border-base)]">
              {filtered.map((c) => {
                const active = selected?.id === c.id;
                const flags = needsTags(c) + awaitingSignature(c);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={active}
                      className={`w-full text-left grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.3fr)_80px_minmax(0,1fr)_minmax(0,1fr)_80px] gap-4 items-center px-4 py-3 transition-colors ${
                        active ? 'bg-[var(--bg-elevated)]' : 'hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[14px] font-medium truncate">{c.name}</span>
                          {flags > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0" aria-label="Has to-dos" />}
                        </span>
                        <span className="block text-[12px] text-[var(--text-dim)] truncate">{c.email}</span>
                      </span>
                      <span className="text-[14px] tabular-nums">
                        {c.placed ? c.tracks.length + c.outsidePlacements : <span className="text-[12px] text-[var(--text-dim)]">{c.submissionCount} sent</span>}
                      </span>
                      <span className="hidden md:block text-[13px] text-[var(--text-secondary)] truncate">{topTags(c, 'genres').slice(0, 3).join(', ') || '·'}</span>
                      <span className="hidden md:block text-[13px] text-[var(--text-secondary)] truncate">{topTags(c, 'moods').slice(0, 3).join(', ') || '·'}</span>
                      <span className="hidden md:block text-[13px] text-[var(--text-muted)] tabular-nums">
                        {c.lastPlacedAt ? new Date(c.lastPlacedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '·'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected && (
            <div className="xl:sticky xl:top-8">
              <Detail
                key={selected.id}
                c={selected}
                playingId={playingId}
                onTogglePlay={togglePlay}
                onTagsSaved={(submissionId, tags) =>
                  updateComposer(selected.id, (c) => ({
                    ...c,
                    tracks: c.tracks.map((t) => (t.submissionId === submissionId ? { ...t, ...tags, tagged: true } : t)),
                  }))
                }
                onNoteSaved={(note) => updateComposer(selected.id, (c) => ({ ...c, note }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
