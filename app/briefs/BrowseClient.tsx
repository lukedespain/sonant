'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BriefRow {
  id: string;
  user_id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: {
    codename?: string;
    project?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
  created_at: string;
  featured_track_url?: string | null;
}

type Tab = 'community' | 'catalog' | 'client';

function tabFromSearch(value: string | null): Tab {
  if (value === 'client') return 'client';
  if (value === 'catalog') return 'catalog';
  return 'community';
}

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Game',
};

function briefSearchHaystack(brief: BriefRow) {
  const c = brief.generated_content ?? {};
  return [c.codename, c.project, c.projectTitle, c.client, brief.target]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
}

type FilterState = {
  search: string;
  filterMode: string;
  filterCategory: string;
  filterMood: string;
  filterGenre: string;
};

function filterBriefs(briefs: BriefRow[], filters: FilterState, extra?: (b: BriefRow) => boolean) {
  const q = filters.search.toLowerCase().trim();
  return briefs.filter((b) => {
    const matchSearch = !q || briefSearchHaystack(b).includes(q);
    const matchMode = !filters.filterMode || b.mode === filters.filterMode;
    const matchCategory = !filters.filterCategory || b.target === filters.filterCategory;
    const matchMood = !filters.filterMood || b.moods.includes(filters.filterMood);
    const matchGenre = !filters.filterGenre || b.genres.includes(filters.filterGenre);
    return matchSearch && matchMode && matchCategory && matchMood && matchGenre && (!extra || extra(b));
  });
}

function collectTags(briefs: BriefRow[]) {
  const moods = new Set<string>();
  const genres = new Set<string>();
  briefs.forEach((b) => {
    b.moods.forEach((m) => moods.add(m));
    b.genres.forEach((g) => genres.add(g));
  });
  return { moods: Array.from(moods).sort(), genres: Array.from(genres).sort() };
}

function ClientBriefCard({
  brief,
}: {
  brief: BriefRow;
}) {
  const content = brief.generated_content ?? {};
  const imageUrl = content.imageUrl as string | undefined;
  const title = (content.projectTitle as string) || (content.codename as string) || 'Untitled';
  const client = (content.client as string) || '';
  const project = (content.project as string) || '';
  const demoFee = content.demoFee as string | undefined;
  const winFee = content.winFee as string | undefined;
  const deadline = content.deadline as string | undefined;
  const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
  const tags = [demoFee, winFee, deadline, brief.target].filter(Boolean) as string[];

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="relative overflow-hidden border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] transition-colors block"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex flex-col md:flex-row min-h-[240px] md:min-h-[280px]">
        <div
          className="relative w-full md:w-[42%] min-h-[180px] md:min-h-0 overflow-hidden"
          style={{ background: imageUrl ? undefined : 'linear-gradient(145deg, #E85D2F 0%, #8B3A1F 100%)' }}
        >
          {imageUrl && (
            <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, transparent 40%, var(--bg-card) 100%)' }}
          />
        </div>
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
          <div
            className="text-[9px] tracking-[0.25em] uppercase text-[#E85D2F] mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ Client brief
          </div>
          <h3
            className="text-3xl md:text-4xl italic tracking-tight text-[var(--text-primary)] mb-2"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            {title}
          </h3>
          <p
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {[client, modeLabel].filter(Boolean).join(' · ')}
          </p>
          {project && (
            <p
              className="text-sm text-[var(--text-muted)] leading-relaxed max-w-lg mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {project}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wider px-2 py-1 border text-[#E85D2F] border-[#E85D2F]/30 bg-[#E85D2F]/5"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Silhouette of a client brief for viewers who are not allowed to receive the
 * real rows. Carries no data — it exists so the locked state has a card-sized
 * body to sit behind the overlay.
 */
function ClientBriefPlaceholder() {
  const bar = (width: string, color: string) => (
    <div style={{ width, height: '10px', background: color, borderRadius: '2px' }} />
  );

  return (
    <div
      className="overflow-hidden border border-[var(--border-card)] bg-[var(--bg-card)]"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex flex-col md:flex-row min-h-[240px] md:min-h-[280px]">
        <div
          className="relative w-full md:w-[42%] min-h-[180px] md:min-h-0"
          style={{ background: 'linear-gradient(145deg, #E85D2F 0%, #8B3A1F 100%)' }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, transparent 40%, var(--bg-card) 100%)' }}
          />
        </div>
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center gap-4">
          {bar('90px', 'rgba(232, 93, 47, 0.35)')}
          <div style={{ width: '70%', maxWidth: '360px', height: '30px', background: 'var(--border-subtle)', borderRadius: '2px' }} />
          {bar('150px', 'var(--border-card)')}
          <div className="flex flex-col gap-2">
            {bar('100%', 'var(--border-card)')}
            {bar('75%', 'var(--border-card)')}
          </div>
          <div className="flex gap-1.5">
            {['70px', '58px', '96px'].map((w) => (
              <div
                key={w}
                style={{ width: w, height: '24px', border: '1px solid rgba(232, 93, 47, 0.3)', background: 'rgba(232, 93, 47, 0.05)', borderRadius: '2px' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefCard({
  brief,
  featured,
  compact = false,
}: {
  brief: BriefRow;
  featured: boolean;
  compact?: boolean;
}) {
  const codename = brief.generated_content?.codename || 'Untitled';
  const project = brief.generated_content?.project;
  const imageUrl = brief.generated_content?.imageUrl;
  const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-colors group overflow-hidden h-full"
      style={{ borderRadius: '2px' }}
    >
      {imageUrl && (
        <div className="relative w-full overflow-hidden" style={{ height: compact ? '100px' : '140px' }}>
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 65%, var(--bg-card) 100%)' }}
          />
        </div>
      )}

      <div className={imageUrl ? 'px-4 pb-4 pt-3' : 'p-5'}>
        {featured && (
          <div
            className="text-[9px] tracking-[0.25em] uppercase text-[#E85D2F] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ Sonant
          </div>
        )}
        {!featured && (
          <div
            className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-dimmer)] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Community
          </div>
        )}

        <h3 className="leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors mb-1">
          <span
            className={compact ? 'text-lg italic' : 'text-xl italic'}
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            {codename}
          </span>
          <span
            className="not-italic mx-1.5 text-[10px] tracking-widest align-middle"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dimmer)' }}
          >
            /
          </span>
          <span
            className="text-[10px] tracking-[0.2em] uppercase not-italic align-middle"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontWeight: 400 }}
          >
            {modeLabel}
          </span>
        </h3>

        {project && !compact && (
          <p className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {project}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span
            className="text-[10px] tracking-wider px-2 py-1 border text-[#E85D2F] border-[#E85D2F]/30 bg-[#E85D2F]/5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            {brief.target}
          </span>
          {[...brief.genres.slice(0, compact ? 1 : 2), ...brief.moods.slice(0, compact ? 1 : 2)].map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="text-[10px] tracking-wider px-2 py-1 bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border-card)]"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function BrowseClient({
  featuredBriefs,
  clientBriefs = [],
  communityBriefs,
  currentUserId = null,
  mineOnlyDefault = false,
  isVerified = false,
  isBriefAdmin = false,
}: {
  featuredBriefs: BriefRow[];
  clientBriefs?: BriefRow[];
  communityBriefs: BriefRow[];
  currentUserId?: string | null;
  mineOnlyDefault?: boolean;
  isVerified?: boolean;
  isBriefAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromSearch(searchParams.get('tab')));
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [mineOnly, setMineOnly] = useState(mineOnlyDefault);

  useEffect(() => {
    setActiveTab(tabFromSearch(searchParams.get('tab')));
    setMineOnly(searchParams.get('mine') === '1');
  }, [searchParams]);

  useEffect(() => {
    setFilterCategory('');
  }, [filterMode]);

  const BRAND_CATEGORIES = ['Automotive', 'Beverage', 'Fashion', 'Financial', 'Food', 'Healthcare', 'Lifestyle', 'Sports', 'Technology'];
  const FILM_CATEGORIES = ['Action', 'Documentary', 'Drama', 'Horror', 'Romance / Indie', 'Sci-Fi', 'Thriller / Suspense'];
  const GAME_CATEGORIES = ['Boss Battle', 'Cinematic / Cutscene', 'Combat / Action', 'Exploration / Open World', 'Horror / Stealth', 'Main Menu / Title', 'Puzzle / Casual'];

  const availableCategories = useMemo(() => {
    if (filterMode === 'brand') return BRAND_CATEGORIES;
    if (filterMode === 'film') return FILM_CATEGORIES;
    if (filterMode === 'games') return GAME_CATEGORIES;
    return [...BRAND_CATEGORIES, ...FILM_CATEGORIES, ...GAME_CATEGORIES].sort();
  }, [filterMode]);

  const filterState: FilterState = { search, filterMode, filterCategory, filterMood, filterGenre };

  const sourceBriefs =
    activeTab === 'catalog' ? featuredBriefs : activeTab === 'client' ? clientBriefs : communityBriefs;
  const { moods: allMoods, genres: allGenres } = useMemo(() => collectTags(sourceBriefs), [sourceBriefs]);

  const filteredCommunity = useMemo(
    () => filterBriefs(communityBriefs, filterState, (b) => !mineOnly || b.user_id === currentUserId),
    [communityBriefs, search, filterMode, filterCategory, filterMood, filterGenre, mineOnly, currentUserId]
  );
  const filteredCatalog = useMemo(
    () => filterBriefs(featuredBriefs, filterState),
    [featuredBriefs, search, filterMode, filterCategory, filterMood, filterGenre]
  );
  const filteredClient = useMemo(
    () => filterBriefs(clientBriefs, filterState),
    [clientBriefs, search, filterMode, filterCategory, filterMood, filterGenre]
  );

  const clearFilters = () => {
    setSearch('');
    setFilterMode('');
    setFilterCategory('');
    setFilterMood('');
    setFilterGenre('');
  };

  const hasFilters = !!(search || filterMode || filterCategory || filterMood || filterGenre);
  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  const filterBar = (
    <div className="flex flex-wrap gap-3 mb-6 items-end">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or project…"
          className="w-full px-4 py-2.5 text-sm bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[#E85D2F] focus:outline-none"
          style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
        />
      </div>
      <div className="relative">
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
          <option value="">All Types</option>
          <option value="brand">Brand</option>
          <option value="film">Film</option>
          <option value="games">Games</option>
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
      </div>
      <div className="relative">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
          <option value="">All Categories</option>
          {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
      </div>
      <div className="relative">
        <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
          <option value="">All Moods</option>
          {allMoods.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
      </div>
      <div className="relative">
        <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
          <option value="">All Genres</option>
          {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
      </div>
      {hasFilters && (
        <button type="button" onClick={clearFilters} className="text-xs tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Clear
        </button>
      )}
      {activeTab === 'community' && currentUserId && (
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="accent-[#E85D2F]"
          />
          <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Show only my briefs
          </span>
        </label>
      )}
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'community', label: 'Community Briefs' },
    { key: 'catalog', label: 'Catalog Briefs' },
    { key: 'client', label: 'Client Briefs' },
  ];

  return (
    <>
      <div className="mb-10 max-w-2xl">
        <h1
          className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Briefs.
        </h1>
        <p
          className="text-sm text-[var(--text-tertiary)] leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Briefs you write to. Community briefs anyone can take, catalog briefs from the houses, and paid client jobs once you have three placements.
        </p>
      </div>

      <div className="flex items-end mb-8 border-b border-[var(--border-base)]">
        <div className="flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); clearFilters(); }}
              className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 ${
                activeTab === key
                  ? 'text-[var(--text-primary)] border-[#E85D2F]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'client' && (
        <>
          <div className="flex items-start justify-between gap-6 mb-8">
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {isBriefAdmin
                ? 'Live jobs from brands, studios, and supervisors. Add a client brief to turn their document into a published job for verified composers.'
                : 'Real briefs from brands, studios, and supervisors. Verified composers get first access.'}
            </p>
            {isBriefAdmin && (
              <Link
                href="/admin?tab=briefs"
                className="shrink-0 px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase border border-[#E85D2F] text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[var(--bg-base)] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                + Add client brief
              </Link>
            )}
          </div>
          <div className="relative">
            {isVerified ? (
              <>
                {filterBar}
                <p className="text-xs text-[var(--text-dimmer)] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {filteredClient.length} brief{filteredClient.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-col gap-4">
                  {filteredClient.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {hasFilters ? 'No briefs match your filters.' : 'No active client briefs yet.'}
                    </p>
                  ) : (
                    filteredClient.map((brief) => <ClientBriefCard key={brief.id} brief={brief} />)
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className="select-none pointer-events-none"
                  style={{ filter: 'blur(10px)', transform: 'scale(1.01)' }}
                  aria-hidden="true"
                >
                  <ClientBriefPlaceholder />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-[var(--bg-base)]/35">
                  <div
                    className="w-12 h-12 flex items-center justify-center border border-[#E85D2F]/40 text-[#E85D2F] mb-5"
                    style={{ borderRadius: '2px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="4.5" y="9" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div
                    className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] mb-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Verified composers only
                  </div>
                  <p
                    className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Place three tracks in the catalog to earn the badge and unlock access to paid client briefs.
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'catalog' && (
        <>
          <div className="mb-6 max-w-xl">
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Briefs from Sonant, and later from houses like Thought Collective, around tracks the catalogs are looking for. Every submission receives written feedback. Accepted tracks are pitched by Thought Collective.
            </p>
          </div>

          {filterBar}

          <p className="text-xs text-[var(--text-dimmer)] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {filteredCatalog.length} brief{filteredCatalog.length !== 1 ? 's' : ''}
          </p>

          {filteredCatalog.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {hasFilters ? 'No briefs match your filters.' : 'No catalog briefs yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalog.map((brief) => (
                <BriefCard key={brief.id} brief={brief} featured />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'community' && (
        <>
          <div className="mb-6 max-w-xl">
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Practice briefs from the Generator. Upload a take to the playlist for free, or spend a credit to submit for written feedback.
            </p>
          </div>

          {filterBar}

          <p className="text-xs text-[var(--text-dimmer)] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {filteredCommunity.length} brief{filteredCommunity.length !== 1 ? 's' : ''}
          </p>

          {filteredCommunity.length === 0 ? (
            <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center" style={{ borderRadius: '2px' }}>
              <p className="text-sm text-[var(--text-muted)] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {hasFilters ? 'No briefs match your filters.' : 'No community briefs yet. Generate the first one.'}
              </p>
              <a href="/generator"
                className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                ◆ Open Generator
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommunity.map((brief) => (
                <BriefCard key={brief.id} brief={brief} featured={false} compact />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
