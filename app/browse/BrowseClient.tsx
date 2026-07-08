'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BriefRow {
  id: string;
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
}

type Tab = 'all' | 'mine';

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Games',
};

function BriefCard({ brief, detailBase }: { brief: BriefRow; detailBase: string }) {
  const codename = brief.generated_content?.codename || 'Untitled';
  const project = brief.generated_content?.project;
  const imageUrl = brief.generated_content?.imageUrl;
  const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
  const date = new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Link
      href={`${detailBase}/${brief.id}`}
      className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-colors group overflow-hidden"
      style={{ borderRadius: '2px' }}
    >
      {/* Hero image */}
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
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors">
            <span
              className="text-[10px] tracking-[0.25em] uppercase not-italic align-middle"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontWeight: 400 }}
            >
              {modeLabel.toUpperCase()} PROJECT
            </span>
            <span
              className="not-italic align-middle mx-2 text-[10px] tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dimmer)' }}
            >
              /
            </span>
            <span
              className="text-xl italic"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
            >
              {codename}
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

        {/* Tags: category first, then genres + moods */}
        <div className="flex flex-wrap gap-1.5">
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
      </div>
    </Link>
  );
}

function BriefGrid({ briefs, detailBase }: { briefs: BriefRow[]; detailBase: string }) {
  if (briefs.length === 0) {
    return (
      <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center" style={{ borderRadius: '2px' }}>
        <div className="text-3xl text-[var(--text-dimmer)] mb-4">◇</div>
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          No briefs match your filters. Try clearing some.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {briefs.map((brief) => (
        <BriefCard key={brief.id} brief={brief} detailBase={detailBase} />
      ))}
    </div>
  );
}

export default function BrowseClient({
  allBriefs,
  myBriefs,
}: {
  allBriefs: BriefRow[];
  myBriefs: BriefRow[];
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get('tab') === 'mine' ? 'mine' : 'all'
  );
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  useEffect(() => {
    if (searchParams.get('tab') === 'mine') setActiveTab('mine');
  }, [searchParams]);

  // Reset category when mode changes
  useEffect(() => {
    setFilterCategory('');
  }, [filterMode]);

  const sourceBriefs = activeTab === 'all' ? allBriefs : myBriefs;

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    sourceBriefs
      .filter((b) => !filterMode || b.mode === filterMode)
      .forEach((b) => set.add(b.target));
    return Array.from(set).sort();
  }, [sourceBriefs, filterMode]);

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
    const result = sourceBriefs.filter((b) => {
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

    return [...result].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [sourceBriefs, search, filterMode, filterCategory, filterMood, filterGenre]);

  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  const clearFilters = () => {
    setSearch('');
    setFilterMode('');
    setFilterCategory('');
    setFilterMood('');
    setFilterGenre('');
  };

  const hasFilters = !!(search || filterMode || filterCategory || filterMood || filterGenre);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border-base)]">
        {([['all', `All Briefs (${allBriefs.length})`], ['mine', `My Briefs (${myBriefs.length})`]] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as Tab); clearFilters(); }}
            className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 ${
              activeTab === tab
                ? 'text-[var(--text-primary)] border-[#E85D2F]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {label}
          </button>
        ))}
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

        {/* Mode filter */}
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
        {filtered.length} brief{filtered.length !== 1 ? 's' : ''} found
      </p>

      <BriefGrid
        briefs={filtered}
        detailBase={activeTab === 'all' ? '/browse' : '/library'}
      />
    </>
  );
}
