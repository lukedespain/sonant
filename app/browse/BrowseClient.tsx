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

type Tab = 'catalog' | 'client';

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Game',
};

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
      href={`/browse/${brief.id}`}
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
            ◆ Featured
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
  communityBriefs,
  currentUserId = null,
  mineOnlyDefault = false,
}: {
  featuredBriefs: BriefRow[];
  communityBriefs: BriefRow[];
  currentUserId?: string | null;
  mineOnlyDefault?: boolean;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'client' ? 'client' : 'catalog'
  );
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [mineOnly, setMineOnly] = useState(mineOnlyDefault);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'client' ? 'client' : 'catalog');
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

  const allMoods = useMemo(() => {
    const set = new Set<string>();
    communityBriefs.forEach((b) => b.moods.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [communityBriefs]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    communityBriefs.forEach((b) => b.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [communityBriefs]);

  const filteredCommunity = useMemo(() => {
    return communityBriefs.filter((b) => {
      const codename = b.generated_content?.codename?.toLowerCase() ?? '';
      const project = b.generated_content?.project?.toLowerCase() ?? '';
      const q = search.toLowerCase();
      const matchSearch = !q || codename.includes(q) || project.includes(q) || b.target.toLowerCase().includes(q);
      const matchMode = !filterMode || b.mode === filterMode;
      const matchCategory = !filterCategory || b.target === filterCategory;
      const matchMood = !filterMood || b.moods.includes(filterMood);
      const matchGenre = !filterGenre || b.genres.includes(filterGenre);
      const matchMine = !mineOnly || b.user_id === currentUserId;
      return matchSearch && matchMode && matchCategory && matchMood && matchGenre && matchMine;
    });
  }, [communityBriefs, search, filterMode, filterCategory, filterMood, filterGenre, mineOnly, currentUserId]);

  const clearFilters = () => {
    setSearch('');
    setFilterMode('');
    setFilterCategory('');
    setFilterMood('');
    setFilterGenre('');
  };

  const hasFilters = !!(search || filterMode || filterCategory || filterMood || filterGenre);
  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'catalog', label: 'Sonant Briefs' },
    { key: 'client', label: 'Client Briefs' },
  ];

  return (
    <>
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
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Active <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>client briefs.</span>
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Real briefs from brands, studios, and supervisors. Not live yet. When they are, composers with the Sonant badge get first access.
            </p>
          </div>
          <div className="py-20 text-center border border-dashed border-[var(--border-base)]" style={{ borderRadius: '2px' }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Coming soon
            </div>
            <p className="text-base text-[var(--text-secondary)] mb-2 max-w-sm mx-auto" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Client briefs are on their way.
            </p>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Earn the badge with three accepted catalog submissions. Badge holders get first access when real client briefs go live.
            </p>
          </div>
        </>
      )}

      {activeTab === 'catalog' && (
        <>
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Featured <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>briefs.</span>
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Curated briefs for tracks the Sonant catalog is looking for. Every submission receives written feedback. Accepted tracks are placed and pitched to buyers.
            </p>
          </div>

          <div className="mb-16">
            <div className="sonant-h-scroll flex gap-4 pb-1 snap-x snap-mandatory">
              {featuredBriefs.map((brief) => (
                <div key={brief.id} className="min-w-[260px] max-w-[260px] md:min-w-[300px] md:max-w-[300px] snap-start shrink-0">
                  <BriefCard brief={brief} featured />
                </div>
              ))}
              {featuredBriefs.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  No featured briefs yet.
                </p>
              )}
            </div>
          </div>

          <div className="mb-6 max-w-xl">
            <h2 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Community <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>briefs.</span>
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Practice briefs written by composers in the community. Submit to these as well. Every submission receives written feedback.
            </p>
          </div>

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
              <button onClick={clearFilters} className="text-xs tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Clear
              </button>
            )}
            {currentUserId && (
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
