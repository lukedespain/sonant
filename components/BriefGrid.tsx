'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui';
import HomeStarButton from '@/components/HomeStarButton';
import FilterMenu from '@/components/FilterMenu';
import { composerStatus } from '@/lib/submission-status';
import { norm, titleCase } from '@/lib/sound';
import { IconArrowUpRight, IconBriefs, IconClose, IconSearch } from '@/components/shell/icons';

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
  vocals?: 'Instrumental' | 'Vocals' | 'Either' | null;
  /** Reference tracks ("Artist, Title"), for search. */
  references?: string[];
  /** Tags that match the viewer's sound. */
  fit?: string[];
  /** The signed-in composer's submission to this brief, if any. */
  submission?: { status: string; needsSignature?: boolean } | null;
};

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film & TV', games: 'Games' };

function postedLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 7) return 'New';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/* ---------------- Cards ---------------- */

function CardPill({ brief, showFit }: { brief: BriefCard; showFit: boolean }) {
  if (brief.submission) {
    const s = composerStatus(brief.submission);
    return (
      <StatusPill tone={s.tone} pulse={s.pulse}>
        {s.label === 'In review' ? 'Submitted' : s.label}
      </StatusPill>
    );
  }
  if (brief.closed) return <StatusPill tone="muted">Closed</StatusPill>;
  if (showFit && brief.fit && brief.fit.length > 0) {
    return (
      <StatusPill tone="signal" dot={false}>
        {brief.fit.length} match
      </StatusPill>
    );
  }
  return null;
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

/** Up to three tags, the ones that fit you first. */
function cardTags(brief: BriefCard) {
  const fit = new Set((brief.fit ?? []).map(norm));
  const seen = new Set<string>();
  const unique = [...brief.genres, ...(brief.moods ?? [])]
    .map(titleCase)
    .filter((t) => (seen.has(norm(t)) ? false : (seen.add(norm(t)), true)));
  return [...unique.filter((t) => fit.has(norm(t))), ...unique.filter((t) => !fit.has(norm(t)))].slice(0, 3);
}

function Tags({ brief }: { brief: BriefCard }) {
  const fit = new Set((brief.fit ?? []).map(norm));
  const tags = cardTags(brief);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center h-6 px-2.5 rounded-full text-[12px] ${
            fit.has(norm(tag)) ? 'bg-[var(--signal-soft)] text-[var(--signal)]' : 'bg-[var(--accent-soft)] text-[var(--text-secondary)]'
          }`}
        >
          {tag}
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
      <Cover brief={brief} admin={admin} className="aspect-[16/10] md:aspect-auto md:min-h-[320px]" />
      <div className="p-6 md:p-8 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--signal)] font-medium">Featured</span>
          <CardPill brief={brief} showFit />
        </div>
        <h3 className="mt-4 text-[26px] md:text-[32px] font-semibold tracking-[-0.03em] leading-[1.08] text-balance">{brief.title}</h3>
        {brief.logline && <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed line-clamp-3">{brief.logline}</p>}
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

function Card({ brief, admin, showFit }: { brief: BriefCard; admin: boolean; showFit: boolean }) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group flex flex-col h-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden transition-colors hover:border-[var(--border-hover)]"
    >
      <Cover brief={brief} admin={admin} className="aspect-[16/10]" />
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--text-dim)] min-h-6">
          <span className="truncate">{[MODE_LABELS[brief.mode], postedLabel(brief.createdAt)].filter(Boolean).join(' · ')}</span>
          <CardPill brief={brief} showFit={showFit} />
        </div>
        <h3 className="text-[16px] font-semibold tracking-[-0.02em] leading-snug">{brief.title}</h3>
        <div className="mt-auto pt-1">
          <Tags brief={brief} />
        </div>
      </div>
    </Link>
  );
}

function Row({ brief }: { brief: BriefCard }) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="row-hover grid grid-cols-[56px_minmax(0,1fr)_auto] md:grid-cols-[56px_minmax(0,1fr)_minmax(0,260px)_110px] gap-4 items-center px-4 py-3"
    >
      <span className="relative block w-14 h-10 rounded-lg overflow-hidden bg-[var(--bg-elevated)]">
        {brief.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brief.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </span>
      <span className="text-[14px] font-medium truncate">{brief.title}</span>
      <span className="hidden md:block">
        <Tags brief={brief} />
      </span>
      <span className="text-[12px] text-[var(--text-dim)] text-right">
        {[MODE_LABELS[brief.mode], postedLabel(brief.createdAt)].filter(Boolean).join(' · ')}
      </span>
    </Link>
  );
}

/* ---------------- Filters ---------------- */

function tally(values: string[][]) {
  const counts = new Map<string, { label: string; n: number }>();
  for (const list of values) {
    const seen = new Set<string>();
    for (const raw of list) {
      const k = norm(raw);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const cur = counts.get(k);
      counts.set(k, { label: cur?.label ?? titleCase(raw), n: (cur?.n ?? 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

/* ---------------- Grid ---------------- */

export default function BriefGrid({
  briefs,
  showTabs = true,
  feature = false,
  filters = false,
  admin = false,
  sound = null,
  emptyText = 'No open briefs right now. New ones land here first.',
}: {
  briefs: BriefCard[];
  /** False for the homepage's plain row of cards. */
  showTabs?: boolean;
  /** Give a starred brief the wide treatment in the All view. */
  feature?: boolean;
  /** The search and filter bar. */
  filters?: boolean;
  /** Show the feature star on every card. */
  admin?: boolean;
  /** The viewer's sound, when signed in. Null hides For you. */
  sound?: { genres: string[]; moods: string[] } | null;
  emptyText?: string;
}) {
  const hasSound = !!sound && sound.genres.length + sound.moods.length > 0;
  const [view, setView] = useState<'foryou' | 'all'>(hasSound ? 'foryou' : 'all');
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [media, setMedia] = useState<string[]>([]);
  const [vocals, setVocals] = useState<string[]>([]);

  const genreOptions = useMemo(() => tally(briefs.map((b) => b.genres)), [briefs]);
  const moodOptions = useMemo(() => tally(briefs.map((b) => b.moods ?? [])), [briefs]);
  const mediaOptions = useMemo(() => tally(briefs.map((b) => (MODE_LABELS[b.mode] ? [MODE_LABELS[b.mode]] : []))), [briefs]);
  const vocalOptions = useMemo(() => tally(briefs.map((b) => (b.vocals ? [b.vocals] : []))), [briefs]);

  const words = norm(query).split(/\s+/).filter(Boolean);
  const has = (list: string[] | undefined, tag: string) => (list ?? []).some((t) => norm(t) === norm(tag));
  const filtering = words.length > 0 || genres.length + moods.length + media.length + vocals.length > 0;

  const matches = briefs.filter((b) => {
    if (words.length) {
      const hay = norm([b.title, b.logline, ...b.genres, ...(b.moods ?? []), ...(b.references ?? [])].join(' '));
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (!genres.every((g) => has(b.genres, g))) return false;
    if (!moods.every((m) => has(b.moods, m))) return false;
    if (media.length && !media.some((m) => MODE_LABELS[b.mode] === m)) return false;
    if (vocals.length && !(b.vocals && (vocals.includes(b.vocals) || b.vocals === 'Either'))) return false;
    return true;
  });

  const forYou = view === 'foryou' && hasSound;
  const ordered = forYou
    ? [...matches].sort((a, b) => (b.fit?.length ?? 0) - (a.fit?.length ?? 0) || b.createdAt.localeCompare(a.createdAt))
    : matches;
  const fits = forYou ? ordered.filter((b) => (b.fit?.length ?? 0) > 0) : ordered;
  const others = forYou ? ordered.filter((b) => (b.fit?.length ?? 0) === 0) : [];
  const [lead, ...rest] = fits;
  const showFeature = feature && !forYou && !filtering && lead?.featured;
  const grid = showFeature ? rest : fits;

  const chips = [
    ...genres.map((v) => ({ v, clear: () => setGenres(genres.filter((x) => x !== v)) })),
    ...moods.map((v) => ({ v, clear: () => setMoods(moods.filter((x) => x !== v)) })),
    ...media.map((v) => ({ v, clear: () => setMedia(media.filter((x) => x !== v)) })),
    ...vocals.map((v) => ({ v, clear: () => setVocals(vocals.filter((x) => x !== v)) })),
  ];
  function clearAll() {
    setQuery('');
    setGenres([]);
    setMoods([]);
    setMedia([]);
    setVocals([]);
  }

  return (
    <div>
      {filters && (
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {sound && (
              <div className="inline-flex p-1 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)]" role="tablist">
                {(
                  [
                    ['foryou', 'For you'],
                    ['all', `All ${briefs.length}`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={view === id}
                    onClick={() => setView(id)}
                    className={`h-8 px-3.5 rounded-full text-[13px] transition-colors ${
                      view === id ? 'bg-[var(--accent)] text-[#0A0A0A] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <label className="flex-1 min-w-[220px] flex items-center gap-2.5 h-10 px-3.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-input)] focus-within:border-[var(--signal-line)] focus-within:ring-4 focus-within:ring-[var(--signal-soft)] transition-colors">
              <IconSearch size={15} className="text-[var(--text-dim)] shrink-0" />
              <span className="sr-only">Search briefs</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, genres, moods, or reference artists"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)]"
              />
            </label>
            <FilterMenu label="Genre" options={genreOptions} value={genres} onChange={setGenres} searchable />
            <FilterMenu label="Mood" options={moodOptions} value={moods} onChange={setMoods} searchable />
            {mediaOptions.length > 1 && <FilterMenu label="Medium" options={mediaOptions} value={media} onChange={setMedia} />}
            {vocalOptions.length > 1 && <FilterMenu label="Vocals" options={vocalOptions} value={vocals} onChange={setVocals} />}
          </div>

          {(sound || chips.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--text-muted)] min-h-7">
              {sound &&
                (hasSound ? (
                  <>
                    <span>Your sound:</span>
                    {[...sound.genres, ...sound.moods].slice(0, 6).map((t) => (
                      <span key={t} className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent-soft)] text-[12px] text-[var(--text-secondary)]">
                        {t}
                      </span>
                    ))}
                    <Link href="/dashboard?tab=profile#sound" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-4">
                      Edit
                    </Link>
                  </>
                ) : (
                  <span>
                    <Link href="/dashboard?tab=profile#sound" className="text-[var(--text-primary)] underline underline-offset-4 hover:text-[var(--signal)]">
                      Pick your sound
                    </Link>{' '}
                    to see the best fits first.
                  </span>
                ))}
              {chips.length > 0 && (
                <span className="ml-auto flex flex-wrap items-center gap-1.5">
                  {chips.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={c.clear}
                      className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-[var(--bg-elevated)] text-[12px] text-[var(--text-primary)] hover:bg-[#1F1F1F]"
                      aria-label={`Remove ${c.v}`}
                    >
                      {c.v} <IconClose size={10} />
                    </button>
                  ))}
                  <button type="button" onClick={clearAll} className="h-7 px-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    Clear
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 text-center text-[14px] text-[var(--text-muted)]">
          {filtering ? (
            <>
              Nothing matches that.{' '}
              <button type="button" onClick={clearAll} className="text-[var(--text-primary)] underline underline-offset-4">
                Clear filters
              </button>
            </>
          ) : (
            emptyText
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {forYou && fits.length > 0 && (
            <p className="text-[13px] text-[var(--text-muted)]">
              {fits.length} {fits.length === 1 ? 'brief fits' : 'briefs fit'} your sound
            </p>
          )}
          {showFeature && <FeatureCard brief={lead} admin={admin} />}
          {grid.length > 0 && (
            <ul className={`grid gap-3 sm:grid-cols-2 ${filters ? 'lg:grid-cols-3 2xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {grid.map((brief) => (
                <li key={brief.id}>
                  <Card brief={brief} admin={admin} showFit={forYou || (!showTabs && (brief.fit?.length ?? 0) > 0)} />
                </li>
              ))}
            </ul>
          )}
          {forYou && fits.length === 0 && (
            <p className="text-[14px] text-[var(--text-muted)]">Nothing open fits your sound right now. Here is everything else.</p>
          )}
          {others.length > 0 && (
            <section className="mt-6">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3">Outside your usual</h2>
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
                {others.map((b) => (
                  <Row key={b.id} brief={b} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
