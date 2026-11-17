'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui';
import { composerStatus } from '@/lib/submission-status';
import { IconArrowUpRight, IconBriefs, IconClose } from '@/components/shell/icons';
import HomeStarButton from '@/components/HomeStarButton';

export type BriefCard = {
  id: string;
  title: string;
  logline: string;
  imageUrl: string | null;
  mode: string;
  genres: string[];
  moods?: string[];
  createdAt: string;
  closed?: boolean;
  featured?: boolean;
  /** The signed-in composer's submission to this brief, if any. */
  submission?: { status: string; needsSignature?: boolean } | null;
};

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film & TV', games: 'Games' };

function postedLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'New today';
  if (days < 7) return `New · ${days}d ago`;
  return `Posted ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function BriefStatus({ brief }: { brief: BriefCard }) {
  if (brief.submission) {
    const s = composerStatus(brief.submission);
    return (
      <StatusPill tone={s.tone} pulse={s.pulse}>
        {s.label === 'In review' ? 'Submitted' : s.label}
      </StatusPill>
    );
  }
  if (brief.closed) return <StatusPill tone="muted">Closed</StatusPill>;
  return <StatusPill tone="signal">Open</StatusPill>;
}

function Cover({ brief, className = '', admin = false }: { brief: BriefCard; className?: string; admin?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--bg-elevated)] ${className}`}>
      {admin && (
        <div className="absolute top-3 right-3 z-10">
          <HomeStarButton briefId={brief.id} featured={!!brief.featured} />
        </div>
      )}
      {brief.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brief.imageUrl}
          alt=""
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
            brief.closed ? 'grayscale opacity-50' : ''
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-dimmer)]">
          <IconBriefs size={28} />
        </div>
      )}
    </div>
  );
}

function Tags({ brief }: { brief: BriefCard }) {
  const tags = [...brief.genres.slice(0, 2), ...(brief.moods ?? []).slice(0, 1)];
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent-soft)] text-[12px] text-[var(--text-secondary)]"
        >
          {titleCase(tag)}
        </span>
      ))}
    </div>
  );
}

function FeatureCard({ brief, admin }: { brief: BriefCard; admin: boolean }) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden transition-colors hover:border-[var(--border-hover)]"
    >
      <Cover brief={brief} admin={admin} className="aspect-[16/10] md:aspect-auto md:min-h-[340px]" />
      <div className="p-6 md:p-9 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--signal)] font-medium">Featured brief</span>
          <BriefStatus brief={brief} />
        </div>
        <h3 className="mt-5 text-[26px] md:text-[34px] font-semibold tracking-[-0.03em] leading-[1.08] text-balance">
          {brief.title}
        </h3>
        {brief.logline && (
          <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed line-clamp-4">{brief.logline}</p>
        )}
        <div className="mt-auto pt-8 flex items-end justify-between gap-4">
          <Tags brief={brief} />
          <span className="shrink-0 w-10 h-10 rounded-full bg-[var(--accent)] text-[#0A0A0A] flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <IconArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Card({ brief, admin }: { brief: BriefCard; admin: boolean }) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group flex flex-col h-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden transition-colors hover:border-[var(--border-hover)]"
    >
      <Cover brief={brief} admin={admin} className="aspect-[16/10]" />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--text-dim)]">
          <span className="truncate">
            {[MODE_LABELS[brief.mode], postedLabel(brief.createdAt)].filter(Boolean).join(' · ')}
          </span>
          <BriefStatus brief={brief} />
        </div>
        <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] leading-snug">{brief.title}</h3>
        {brief.logline && (
          <p className="mt-1.5 text-[14px] text-[var(--text-muted)] leading-relaxed line-clamp-2">{brief.logline}</p>
        )}
        <div className="mt-auto pt-5">
          <Tags brief={brief} />
        </div>
      </div>
    </Link>
  );
}

function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, number][];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="w-14 shrink-0 pt-1.5 text-[12px] text-[var(--text-dim)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([tag, n]) => {
          const on = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== tag) : [...value, tag])}
              className={`h-7 px-2.5 rounded-full text-[12px] border transition-colors ${
                on
                  ? 'bg-[var(--accent)] text-[#0A0A0A] border-[var(--accent)] font-medium'
                  : 'border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
              }`}
            >
              {tag}
              <span className={`ml-1 tabular-nums ${on ? 'text-[#0A0A0A]/50' : 'text-[var(--text-dimmer)]'}`}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const norm = (t: string) => t.trim().toLowerCase();
const titleCase = (t: string) => t.trim().replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

/** Tags counted case-insensitively, so "raw" and "Raw" are one chip. */
function tally(briefs: BriefCard[], key: 'genres' | 'moods') {
  const counts = new Map<string, { label: string; n: number }>();
  for (const b of briefs) {
    const seen = new Set<string>();
    for (const t of key === 'genres' ? b.genres : b.moods ?? []) {
      const k = norm(t);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const cur = counts.get(k);
      counts.set(k, { label: cur?.label ?? titleCase(t), n: (cur?.n ?? 0) + 1 });
    }
  }
  return [...counts.values()]
    .map((v) => [v.label, v.n] as [string, number])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const hasTag = (list: string[] | undefined, tag: string) => (list ?? []).some((t) => norm(t) === norm(tag));

export default function BriefGrid({
  briefs,
  showTabs = true,
  feature = false,
  filters = false,
  admin = false,
  emptyText = 'No open briefs right now. New ones land here first.',
}: {
  briefs: BriefCard[];
  showTabs?: boolean;
  /** Give a starred first brief the wide treatment. */
  feature?: boolean;
  /** Genre and mood chips. */
  filters?: boolean;
  /** Show the feature star on every card. */
  admin?: boolean;
  emptyText?: string;
}) {
  const modes = useMemo(() => [...new Set(briefs.map((b) => b.mode).filter((m) => MODE_LABELS[m]))], [briefs]);
  const genreOptions = useMemo(() => tally(briefs, 'genres'), [briefs]);
  const moodOptions = useMemo(() => tally(briefs, 'moods'), [briefs]);
  const [mode, setMode] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const filtering = genres.length > 0 || moods.length > 0;
  const visible = briefs.filter(
    (b) =>
      (!mode || b.mode === mode) &&
      genres.every((g) => hasTag(b.genres, g)) &&
      moods.every((m) => hasTag(b.moods, m)),
  );
  const [lead, ...rest] = visible;
  const showFeature = feature && !mode && !filtering && lead?.featured;
  const grid = showFeature ? rest : visible;

  return (
    <div>
      {(showTabs || filters) && (
        <div className="flex items-center justify-between gap-3 mb-5">
        {showTabs && modes.length > 1 ? (
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist">
          {[{ value: '', label: 'All' }, ...modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))].map((tab) => {
            const active = mode === tab.value;
            const count = tab.value ? briefs.filter((b) => b.mode === tab.value).length : briefs.length;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.value)}
                className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-[#0A0A0A] font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]'
                }`}
              >
                {tab.label}
                <span className={`tabular-nums ${active ? 'text-[#0A0A0A]/60' : 'text-[var(--text-dimmer)]'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        ) : <span />}
        {filters && (genreOptions.length > 0 || moodOptions.length > 0) && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`h-8 px-3.5 rounded-full text-[13px] border flex items-center gap-1.5 shrink-0 transition-colors ${
              showFilters || filtering
                ? 'border-[var(--border-hover)] text-[var(--text-primary)]'
                : 'border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Genre &amp; mood
            {filtering && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--signal)] text-[#0A0A0A] text-[11px] font-semibold flex items-center justify-center">
                {genres.length + moods.length}
              </span>
            )}
          </button>
        )}
        </div>
      )}

      {filters && showFilters && (
        <div className="mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 flex flex-col gap-3 animate-rise">
          <FilterChips label="Genre" options={genreOptions} value={genres} onChange={setGenres} />
          <FilterChips label="Mood" options={moodOptions} value={moods} onChange={setMoods} />
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setGenres([]);
                setMoods([]);
              }}
              className="self-start ml-[68px] inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <IconClose size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 text-center text-[14px] text-[var(--text-muted)]">
          {filtering ? 'No briefs match all of those tags. Try fewer.' : emptyText}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {showFeature && <FeatureCard brief={lead} admin={admin} />}
          {grid.length > 0 && (
            <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {grid.map((brief) => (
                <li key={brief.id}>
                  <Card brief={brief} admin={admin} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
