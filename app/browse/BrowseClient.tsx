'use client';

import { useState, useMemo } from 'react';
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
    [key: string]: unknown;
  };
  created_at: string;
}

type Tab = 'all' | 'mine';

const ALL_CATEGORIES = [
  'Sports', 'Automotive', 'Technology', 'Fashion',
  'Lifestyle', 'Beverage', 'Food', 'Healthcare', 'Financial',
];

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
        <Link
          key={brief.id}
          href={`${detailBase}/${brief.id}`}
          className="block p-6 border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-colors group"
          style={{ borderRadius: '2px' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3
              className="text-2xl leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
            >
              Project <span className="italic">{brief.generated_content?.codename || 'Untitled'}</span>
            </h3>
            <span
              className="text-[10px] tracking-wider text-[var(--text-dimmer)] shrink-0 mt-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div
            className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {brief.mode === 'brand' ? 'Brand' : brief.mode === 'film' ? 'Film' : 'Games'} · {brief.target}
          </div>

          {brief.generated_content?.project && (
            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {brief.generated_content.project as string}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {[...brief.genres.slice(0, 3), ...brief.moods.slice(0, 3)].map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="text-[10px] tracking-wider px-2 py-1 bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border-card)]"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
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
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const sourceBriefs = activeTab === 'all' ? allBriefs : myBriefs;

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
    let result = sourceBriefs.filter((b) => {
      const codename = b.generated_content?.codename?.toLowerCase() ?? '';
      const project = b.generated_content?.project?.toLowerCase() ?? '';
      const q = search.toLowerCase();
      const matchSearch = !q || codename.includes(q) || project.includes(q) || b.target.toLowerCase().includes(q);
      const matchCategory = !filterCategory || b.target === filterCategory;
      const matchMood = !filterMood || b.moods.includes(filterMood);
      const matchGenre = !filterGenre || b.genres.includes(filterGenre);
      return matchSearch && matchCategory && matchMood && matchGenre;
    });

    result = [...result].sort((a, b) =>
      sortBy === 'newest'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return result;
  }, [sourceBriefs, search, filterCategory, filterMood, filterGenre, sortBy]);

  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterMood('');
    setFilterGenre('');
  };

  const hasFilters = !!(search || filterCategory || filterMood || filterGenre);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border-base)]">
        {([['all', `All Briefs (${allBriefs.length})`], ['mine', `My Briefs (${myBriefs.length})`]] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); clearFilters(); }}
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

        <div className="relative">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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

        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')} className={selectClass} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
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
