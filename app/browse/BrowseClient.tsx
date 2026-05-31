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

const ALL_CATEGORIES = [
  'Sports', 'Automotive', 'Technology', 'Fashion',
  'Lifestyle', 'Beverage', 'Food', 'Healthcare', 'Financial',
];

export default function BrowseClient({ briefs }: { briefs: BriefRow[] }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMood, setFilterMood] = useState<string>('');
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Collect all unique moods and genres from the brief list for filter dropdowns
  const allMoods = useMemo(() => {
    const set = new Set<string>();
    briefs.forEach((b) => b.moods.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [briefs]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    briefs.forEach((b) => b.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [briefs]);

  const filtered = useMemo(() => {
    let result = briefs.filter((b) => {
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
  }, [briefs, search, filterCategory, filterMood, filterGenre, sortBy]);

  const selectClass = `text-xs tracking-[0.15em] uppercase bg-[#141312] border border-[#2A2826] text-[#C4BFB5] px-3 py-2 focus:border-[#E85D2F] focus:outline-none appearance-none pr-6`;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-10 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or project…"
            className="w-full px-4 py-2.5 text-sm bg-[#141312] border border-[#2A2826] text-[#F5F1E8] placeholder:text-[#5A5650] focus:border-[#E85D2F] focus:outline-none"
            style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={selectClass}
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5A5650] text-xs">▾</span>
        </div>

        {/* Mood */}
        <div className="relative">
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className={selectClass}
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            <option value="">All Moods</option>
            {allMoods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5A5650] text-xs">▾</span>
        </div>

        {/* Genre */}
        <div className="relative">
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className={selectClass}
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            <option value="">All Genres</option>
            {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5A5650] text-xs">▾</span>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className={selectClass}
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5A5650] text-xs">▾</span>
        </div>

        {/* Clear */}
        {(search || filterCategory || filterMood || filterGenre) && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setFilterMood(''); setFilterGenre(''); }}
            className="text-xs tracking-[0.15em] uppercase text-[#8A8680] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-[#5A5650] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {filtered.length} brief{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-[#2A2826] bg-[#141312] p-12 text-center" style={{ borderRadius: '2px' }}>
          <div className="text-3xl text-[#5A5650] mb-4">◇</div>
          <p className="text-sm text-[#8A8680]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            No briefs match your filters. Try clearing some.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((brief) => (
            <Link
              key={brief.id}
              href={`/browse/${brief.id}`}
              className="block p-6 border border-[#2A2826] bg-[#141312] hover:border-[#E85D2F] hover:bg-[#181614] transition-colors group"
              style={{ borderRadius: '2px' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3
                  className="text-2xl leading-tight text-[#F5F1E8] group-hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  Project <span className="italic">{brief.generated_content?.codename || 'Untitled'}</span>
                </h3>
                <span
                  className="text-[10px] tracking-wider text-[#5A5650] shrink-0 mt-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div
                className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680] mb-4"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {brief.mode === 'brand' ? 'Brand' : brief.mode === 'film' ? 'Film' : 'Games'} · {brief.target}
              </div>

              {brief.generated_content?.project && (
                <p className="text-sm text-[#8A8680] mb-4 leading-relaxed line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {brief.generated_content.project as string}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {[...brief.genres.slice(0, 3), ...brief.moods.slice(0, 3)].map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="text-[10px] tracking-wider px-2 py-1 bg-[#0A0908] text-[#A8A39A] border border-[#2A2826]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
