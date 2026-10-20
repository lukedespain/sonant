'use client';

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { catalogPartnerFromBrief } from '@/lib/partners';
import { EmptyState, SectionHeader, btn } from '@/components/ui';
import HomeStarButton from '@/components/HomeStarButton';

export interface BriefRow {
  id: string;
  user_id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: {
    codename?: string;
    project?: string;
    projectTitle?: string;
    imageUrl?: string;
    homeFeatured?: boolean;
    [key: string]: unknown;
  };
  created_at: string;
  featured_track_url?: string | null;
}

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film', games: 'Game' };
const PRACTICE_PAGE = 12;
const START_HERE_KEY = 'sonant:start-here-dismissed';

function titleOf(brief: BriefRow) {
  return brief.generated_content.projectTitle || brief.generated_content.codename || 'Untitled';
}

function haystack(brief: BriefRow) {
  const c = brief.generated_content ?? {};
  return [c.codename, c.project, c.projectTitle, c.client, brief.target]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
}

// ── Start-here dismissal, read without an effect so SSR stays stable ──────────
const listeners = new Set<() => void>();
function readDismissed() {
  try {
    return window.localStorage.getItem(START_HERE_KEY) === '1';
  } catch {
    return false;
  }
}
function useStartHereDismissed() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readDismissed,
    () => true,
  );
}
function dismissStartHere() {
  try {
    window.localStorage.setItem(START_HERE_KEY, '1');
  } catch {}
  listeners.forEach((cb) => cb());
}

function StartHere() {
  const dismissed = useStartHereDismissed();
  if (dismissed) return null;
  const steps = ['Pick a catalog brief', 'Download it and write', 'Submit with your free credit'];
  return (
    <div className="mb-12 border border-[var(--accent-line)] bg-[var(--accent-soft)] rounded-[2px] px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
      <p className="label text-[var(--accent)] shrink-0">◆ Start here</p>
      <ol className="flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-2 flex-1">
        {steps.map((step, i) => (
          <li key={step} className="text-sm text-[var(--text-secondary)]">
            <span className="font-mono text-xs text-[var(--accent)] mr-2 tabular-nums">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={dismissStartHere}
        className="self-start md:self-auto text-[var(--text-dimmer)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────
const selectClass =
  'w-full h-11 pl-3 pr-8 text-sm bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] rounded-[2px] appearance-none focus:border-[var(--accent)] focus:outline-none';

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative min-w-0">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} aria-label={placeholder}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────
function ClientBriefCard({ brief }: { brief: BriefRow }) {
  const c = brief.generated_content;
  const imageUrl = c.imageUrl;
  const meta = [
    c.demoFee ? `Demo fee ${c.demoFee}` : null,
    c.winFee ? `Win ${c.winFee}` : null,
    c.deadline ? `Due ${c.deadline}` : null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group grid md:grid-cols-[2fr_3fr] border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--accent-line)] rounded-[2px] overflow-hidden transition-colors"
    >
      <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[240px] bg-gradient-to-br from-[var(--accent)] to-[#8B3A1F]">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="p-6 md:p-10 flex flex-col justify-center">
        <p className="label text-[var(--accent)]">◆ Paid · {[c.client as string, MODE_LABELS[brief.mode]].filter(Boolean).join(' · ')}</p>
        <h3 className="mt-3 font-serif italic text-3xl md:text-4xl tracking-tight group-hover:text-[var(--accent)] transition-colors">
          {titleOf(brief)}
        </h3>
        {c.project && <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-lg">{c.project}</p>}
        {meta.length > 0 && (
          <p className="mt-5 text-sm text-[var(--text-secondary)] tabular-nums">{meta.join('  ·  ')}</p>
        )}
      </div>
    </Link>
  );
}

function CatalogCard({ brief }: { brief: BriefRow }) {
  const c = brief.generated_content;
  const partner = catalogPartnerFromBrief(c)?.name ?? 'Sonant';
  const chips = [brief.target, ...brief.genres.slice(0, 1), ...brief.moods.slice(0, 1)].filter(Boolean);
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group flex flex-col h-full border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--accent-line)] rounded-[2px] overflow-hidden transition-colors"
    >
      {c.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <p className="label text-[var(--accent)]">◆ {partner}</p>
        <h3 className="mt-2 font-serif italic text-xl tracking-tight leading-snug group-hover:text-[var(--accent)] transition-colors">
          {titleOf(brief)}
        </h3>
        {c.project && <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2">{c.project}</p>}
        <p className="mt-auto pt-4 text-xs text-[var(--text-dimmer)] truncate">
          {[MODE_LABELS[brief.mode], ...chips].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}

function PracticeRow({ brief, newSince }: { brief: BriefRow; newSince: number }) {
  const c = brief.generated_content;
  const isNew = new Date(brief.created_at).getTime() > newSince;
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--accent-line)] rounded-[2px] px-5 py-4 transition-colors min-w-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif italic text-lg tracking-tight leading-snug group-hover:text-[var(--accent)] transition-colors min-w-0 truncate">
          {titleOf(brief)}
        </h3>
        {isNew && <span className="label text-[var(--accent)] shrink-0">New</span>}
      </div>
      {c.project && <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-1">{c.project}</p>}
      <p className="mt-2 text-xs text-[var(--text-dimmer)] truncate">
        {[MODE_LABELS[brief.mode], brief.target, ...brief.genres.slice(0, 1), ...brief.moods.slice(0, 1)].filter(Boolean).join(' · ')}
      </p>
    </Link>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────
function LockedClientBriefs({
  signedIn,
  acceptedCount,
  threshold,
}: {
  signedIn: boolean;
  acceptedCount: number;
  threshold: number;
}) {
  const done = Math.min(acceptedCount, threshold);
  return (
    <div className="border border-[var(--border-card)] rounded-[2px] px-6 py-10 md:py-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
      <div className="w-11 h-11 shrink-0 flex items-center justify-center border border-[var(--accent-line)] text-[var(--accent)] rounded-[2px]">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="4.5" y="9" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 max-w-xl">
        <p className="font-serif text-xl md:text-2xl tracking-tight">Paid client briefs are for verified composers.</p>
        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
          Client briefs are confidential, pre-release work. They open after {threshold} catalog placements, and we email you the moment a new one lands.
        </p>
      </div>
      {signedIn ? (
        <div className="shrink-0">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: threshold }).map((_, i) => (
              <span key={i} className={`h-1.5 w-10 rounded-full ${i < done ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'}`} />
            ))}
          </div>
          <p className="mt-2 label text-[var(--text-muted)] tabular-nums">
            {done} of {threshold} accepted
          </p>
        </div>
      ) : (
        <Link href="/signup" className={btn('secondary', 'sm', 'shrink-0')}>
          Create free account
        </Link>
      )}
    </div>
  );
}

function CatalogCarousel({ briefs, isAdmin }: { briefs: BriefRow[]; isAdmin: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(briefs.length <= 6);

  function update() {
    const el = scroller.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }
  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={update}
        className="sonant-h-scroll snap-x snap-mandatory md:snap-none -mx-5 px-5 md:mx-0 md:px-0 pb-3"
      >
        <div className="grid grid-flow-col auto-cols-[272px] grid-rows-1 md:grid-rows-2 gap-4 w-max">
          {briefs.map((brief) => (
            <div key={brief.id} className="snap-start relative">
              <CatalogCard brief={brief} />
              {isAdmin && (
                <div className="absolute top-2 right-2">
                  <HomeStarButton briefId={brief.id} featured={!!brief.generated_content.homeFeatured} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!atEnd && (
        <div className="hidden md:block pointer-events-none absolute right-0 top-0 bottom-2 w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent" />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BrowseClient({
  featuredBriefs,
  clientBriefs = [],
  communityBriefs,
  currentUserId = null,
  mineOnlyDefault = false,
  isVerified = false,
  isBriefAdmin = false,
  signedIn = false,
  acceptedCount = 0,
  verificationThreshold = 3,
  showStartHere = false,
  newSince,
}: {
  featuredBriefs: BriefRow[];
  clientBriefs?: BriefRow[];
  communityBriefs: BriefRow[];
  currentUserId?: string | null;
  mineOnlyDefault?: boolean;
  isVerified?: boolean;
  isBriefAdmin?: boolean;
  signedIn?: boolean;
  acceptedCount?: number;
  verificationThreshold?: number;
  showStartHere?: boolean;
  newSince: number;
}) {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [mineOnly, setMineOnly] = useState(mineOnlyDefault);
  const [practiceShown, setPracticeShown] = useState(PRACTICE_PAGE);

  const { moods, genres } = useMemo(() => {
    const m = new Set<string>();
    const g = new Set<string>();
    [...clientBriefs, ...featuredBriefs, ...communityBriefs].forEach((b) => {
      b.moods.forEach((x) => m.add(x));
      b.genres.forEach((x) => g.add(x));
    });
    return { moods: [...m].sort(), genres: [...g].sort() };
  }, [clientBriefs, featuredBriefs, communityBriefs]);

  const hasFilters = !!(search || mode || mood || genre);
  const matches = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (b: BriefRow) =>
      (!q || haystack(b).includes(q)) &&
      (!mode || b.mode === mode) &&
      (!mood || b.moods.includes(mood)) &&
      (!genre || b.genres.includes(genre));
  }, [search, mode, mood, genre]);

  const client = clientBriefs.filter(matches);
  const catalog = featuredBriefs.filter(matches);
  const practice = communityBriefs.filter((b) => matches(b) && (!mineOnly || b.user_id === currentUserId));

  const clearFilters = () => {
    setSearch('');
    setMode('');
    setMood('');
    setGenre('');
  };

  const adminNew = (href: string) =>
    isBriefAdmin ? (
      <Link href={href} className={btn('ghost', 'sm')}>
        + New
      </Link>
    ) : undefined;

  return (
    <>
      {showStartHere && <StartHere />}

      <div className="mb-14 flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search briefs"
          className="w-full h-11 px-4 text-sm bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none"
        />
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <Select
            value={mode}
            onChange={setMode}
            placeholder="Type"
            options={[
              { value: 'brand', label: 'Brand' },
              { value: 'film', label: 'Film' },
              { value: 'games', label: 'Games' },
            ]}
          />
          <Select value={mood} onChange={setMood} placeholder="Mood" options={moods.map((m) => ({ value: m, label: m }))} />
          <Select value={genre} onChange={setGenre} placeholder="Genre" options={genres.map((g) => ({ value: g, label: g }))} />
        </div>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className={btn('ghost', 'sm', 'self-start')}>
            Clear filters
          </button>
        )}
      </div>

      <section className="mb-20">
        <SectionHeader
          title="Paid client briefs"
          count={isVerified ? client.length : undefined}
          actions={adminNew('/admin?tab=briefs')}
        />
        {!isVerified ? (
          <LockedClientBriefs signedIn={signedIn} acceptedCount={acceptedCount} threshold={verificationThreshold} />
        ) : client.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No paid briefs match your filters.' : 'New paid client briefs are on the way.'}
            body={hasFilters ? undefined : 'Verified composers get an email the moment one hits Sonant.'}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {client.map((brief) => (
              <ClientBriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-20">
        <SectionHeader
          id="catalog"
          title="Catalog briefs"
          count={catalog.length}
          actions={adminNew('/admin?tab=briefs&kind=catalog')}
        />
        {catalog.length === 0 ? (
          <EmptyState title={hasFilters ? 'No catalog briefs match your filters.' : 'No catalog briefs right now.'} />
        ) : (
          <CatalogCarousel briefs={catalog} isAdmin={isBriefAdmin} />
        )}
      </section>

      <section>
        <SectionHeader
          title="Practice briefs"
          count={practice.length}
          actions={
            currentUserId ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">Mine only</span>
              </label>
            ) : undefined
          }
        />
        {practice.length === 0 ? (
          <EmptyState
            title={hasFilters || mineOnly ? 'No practice briefs match.' : 'No practice briefs yet.'}
            action={
              <Link href="/generator" className={btn('secondary', 'sm')}>
                Open the generator
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {practice.slice(0, practiceShown).map((brief) => (
                <PracticeRow key={brief.id} brief={brief} newSince={newSince} />
              ))}
            </div>
            {practice.length > practiceShown && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setPracticeShown((n) => n + PRACTICE_PAGE)}
                  className={btn('secondary', 'sm')}
                >
                  Show more · {practice.length - practiceShown} left
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
