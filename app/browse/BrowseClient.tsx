'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

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

type Tab = 'featured' | 'community' | 'mine';

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Game',
};

function MiniTrackPlayer({ url, briefId, briefName }: { url: string; briefId: string; briefName: string }) {
  const { track, isPlaying, play, pause } = useAudioPlayer();
  const isActive = track?.url === url;
  const isCurrentlyPlaying = isActive && isPlaying;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({ url, fileName: 'Featured Track', briefId, briefName });
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-6 h-6 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors shrink-0 text-[10px]"
        style={{ borderRadius: '50%' }}
        title={isCurrentlyPlaying ? 'Pause' : 'Play featured track'}
      >
        {isCurrentlyPlaying ? '■' : '▶'}
      </button>
      <span
        className={`text-[10px] tracking-[0.15em] uppercase ${
          isCurrentlyPlaying ? 'text-[#E85D2F]' : 'text-[var(--text-muted)]'
        }`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {isCurrentlyPlaying ? 'Currently Playing' : 'Featured Track'}
      </span>
    </div>
  );
}

function BriefCard({ brief, detailBase, featured }: { brief: BriefRow; detailBase: string; featured: boolean }) {
  const codename = brief.generated_content?.codename || 'Untitled';
  const project = brief.generated_content?.project;
  const imageUrl = brief.generated_content?.imageUrl;
  const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
  const date = featured ? 'Aug 1 – Aug 31' : new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Link
      href={`${detailBase}/${brief.id}`}
      className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-colors group overflow-hidden"
      style={{ borderRadius: '2px' }}
    >
      {/* Hero image (featured briefs only) */}
      {imageUrl && (
        <div className="relative w-full overflow-hidden" style={{ height: '160px' }}>
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

      <div className={imageUrl ? 'px-5 pb-5 pt-3' : 'p-6'}>
        {/* Featured badge */}
        {featured && (
          <div
            className="text-[9px] tracking-[0.25em] uppercase text-[#E85D2F] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ Sonant Brief
          </div>
        )}

        {/* Title: codename / MODE PROJECT */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors">
            <span
              className="text-xl italic"
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
              {modeLabel} Project
            </span>
          </h3>
          <span
            className="text-[10px] tracking-wider text-[var(--text-dimmer)] shrink-0 mt-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {date}
          </span>
        </div>

        {/* Project name */}
        {project && (
          <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {project}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className="text-[10px] tracking-wider px-2 py-1 border text-[#E85D2F] border-[#E85D2F]/30 bg-[#E85D2F]/5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            {brief.target}
          </span>
          {[...brief.genres.slice(0, 2), ...brief.moods.slice(0, 2)].map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="text-[10px] tracking-wider px-2 py-1 bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border-card)]"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Track player or placeholder — always rendered for uniform card height */}
        <div className="border-t border-[var(--border-card)] pt-4">
          {brief.featured_track_url ? (
            <MiniTrackPlayer
              url={brief.featured_track_url}
              briefId={brief.id}
              briefName={codename}
            />
          ) : (
            <span
              className="text-[10px] text-[var(--text-dimmer)]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {featured ? 'Submit your track →' : 'No tracks uploaded yet'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function BriefGrid({ briefs, detailBase, featured, emptyMessage }: { briefs: BriefRow[]; detailBase: string; featured: boolean; emptyMessage?: string }) {
  if (briefs.length === 0) {
    return (
      <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center" style={{ borderRadius: '2px' }}>
        <div className="text-3xl text-[var(--text-dimmer)] mb-4">◇</div>
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {emptyMessage ?? 'No briefs match your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {briefs.map((brief) => (
        <BriefCard key={brief.id} brief={brief} detailBase={detailBase} featured={featured} />
      ))}
    </div>
  );
}

export default function BrowseClient({
  featuredBriefs,
  communityBriefs,
  myBriefs,
  isLoggedIn,
}: {
  featuredBriefs: BriefRow[];
  communityBriefs: BriefRow[];
  myBriefs: BriefRow[];
  isLoggedIn: boolean;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    if (t === 'community') return 'community';
    if (t === 'mine' && isLoggedIn) return 'mine';
    return 'featured';
  });
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'community') setActiveTab('community');
    else if (t === 'mine') setActiveTab('mine');
  }, [searchParams]);

  useEffect(() => {
    setFilterCategory('');
  }, [filterMode]);

  const sourceBriefs = activeTab === 'featured' ? featuredBriefs : activeTab === 'community' ? communityBriefs : myBriefs;

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
    sourceBriefs.forEach((b) => b.moods.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [sourceBriefs]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    sourceBriefs.forEach((b) => b.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [sourceBriefs]);

  const filtered = useMemo(() => {
    return sourceBriefs.filter((b) => {
      const codename = b.generated_content?.codename?.toLowerCase() ?? '';
      const project = b.generated_content?.project?.toLowerCase() ?? '';
      const q = search.toLowerCase();
      const matchSearch = !q || codename.includes(q) || project.includes(q) || b.target.toLowerCase().includes(q);
      const matchMode = !filterMode || b.mode === filterMode;
      const matchCategory = !filterCategory || b.target === filterCategory;
      const matchMood = !filterMood || b.moods.includes(filterMood);
      const matchGenre = !filterGenre || b.genres.includes(filterGenre);
      return matchSearch && matchMode && matchCategory && matchMood && matchGenre;
    });
  }, [sourceBriefs, search, filterMode, filterCategory, filterMood, filterGenre]);

  const clearFilters = () => {
    setSearch('');
    setFilterMode('');
    setFilterCategory('');
    setFilterMood('');
    setFilterGenre('');
  };

  const hasFilters = !!(search || filterMode || filterCategory || filterMood || filterGenre);

  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'featured', label: 'Sonant Briefs', count: featuredBriefs.length },
    { key: 'community', label: 'Community Briefs', count: communityBriefs.length },
    ...(isLoggedIn ? [{ key: 'mine' as Tab, label: 'My Briefs', count: myBriefs.length }] : []),
  ];

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border-base)]">
        {tabs.map(({ key, label, count }) => (
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
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Dynamic hero per tab */}
      <div className="mb-8">
        {activeTab === 'featured' && (
          <>
            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Each month, a new <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>competition.</span>
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              One Brand brief, one Film brief, one Game brief — written to real industry spec. Submit your track. The strongest placement goes into the catalog and gets pitched to real buyers.
            </p>
          </>
        )}
        {activeTab === 'community' && (
          <>
            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Study the brief. <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>Write to it.</span>
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Briefs generated by the community — no stakes, just reps. Upload your track publicly and get ears on it. Great for experimenting outside your usual wheelhouse.
            </p>
          </>
        )}
        {activeTab === 'mine' && (
          <>
            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Your generated <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>briefs.</span>
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Briefs you&apos;ve created with the generator — all in one place.
            </p>
          </>
        )}
      </div>

      {/* Filters */}
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
      </div>

      <p className="text-xs text-[var(--text-dimmer)] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {filtered.length} brief{filtered.length !== 1 ? 's' : ''}
      </p>

      <BriefGrid
        briefs={filtered}
        detailBase="/browse"
        featured={activeTab === 'featured'}
        emptyMessage={
          activeTab === 'mine' && myBriefs.length === 0
            ? "You haven't generated any briefs yet."
            : 'No briefs match your filters.'
        }
      />
    </>
  );
}
