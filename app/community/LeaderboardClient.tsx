'use client';

import { useState, useMemo } from 'react';

type SortKey = 'submissions' | 'featured' | 'uploads' | 'generations';

interface ComposerRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  submissions: number;
  uploads: number;
  featured: number;
  generations: number;
}

const AVATAR_COLORS = [
  '#E85D2F', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009473', '#DD4132', '#45B5AA',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function RankBadge({ rank }: { rank: number }) {
  const label = String(rank).padStart(2, '0');
  if (rank === 1) return (
    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif" }}>
      {label}
    </div>
  );
  if (rank <= 3) return (
    <div className="w-8 h-8 flex items-center justify-center text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'Fraunces', serif" }}>
      {label}
    </div>
  );
  return (
    <div className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-dimmer)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {label}
    </div>
  );
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'submissions', label: 'Submissions' },
  { key: 'featured',   label: 'Featured'    },
  { key: 'uploads',    label: 'Uploads'      },
  { key: 'generations', label: 'Generations' },
];

export default function LeaderboardClient({ composers }: { composers: ComposerRow[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('submissions');

  const sorted = useMemo(() => {
    return [...composers].sort((a, b) => b[sortBy] - a[sortBy] || b.submissions - a.submissions);
  }, [composers, sortBy]);

  return (
    <>
      {/* Column headers — aligned with stat columns */}
      <div className="flex items-center gap-5 mb-3">
        {/* Spacers to match rank badge + avatar + name */}
        <div className="w-8 shrink-0" />
        <div className="w-10 shrink-0" />
        <div className="flex-1 min-w-0" />

        {/* Clickable sort headers */}
        <div className="flex items-center gap-8 shrink-0">
          {COLUMNS.map(({ key, label }) => {
            const active = sortBy === key;
            return (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`min-w-[60px] text-center flex flex-col items-center gap-0.5 group transition-colors ${
                  active ? 'text-[#E85D2F]' : 'text-[var(--text-dimmer)] hover:text-[var(--text-muted)]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="text-[8px] tracking-[0.25em] uppercase leading-none">
                  {label}
                </span>
                <span className="text-[10px] leading-none">
                  {active ? '↓' : <span className="opacity-0 group-hover:opacity-40">↓</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-[var(--border-base)] mb-0" />

      {/* Rows */}
      <div className="space-y-0">
        {sorted.map((composer, i) => {
          const rank = i + 1;
          const color = avatarColor(composer.id);
          const isTop3 = rank <= 3;
          return (
            <div
              key={composer.id}
              className="flex items-center gap-5 py-5 border-b border-[var(--border-base)] hover:bg-[var(--bg-card)] transition-colors -mx-4 px-4"
              style={{ borderRadius: '2px' }}
            >
              <RankBadge rank={rank} />

              <div
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ background: composer.avatarUrl ? undefined : color, fontFamily: "'DM Sans', sans-serif" }}
              >
                {composer.avatarUrl
                  ? <img src={composer.avatarUrl} alt={composer.name} className="w-full h-full object-cover" />
                  : initials(composer.name)
                }
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`text-base truncate block ${isTop3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: isTop3 ? 400 : 300 }}
                >
                  {composer.name}
                </span>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                {COLUMNS.map(({ key }) => {
                  const active = sortBy === key;
                  const val = composer[key];
                  return (
                    <div key={key} className="text-center min-w-[60px]">
                      <div
                        className={`text-xl tabular-nums transition-colors ${
                          active && val > 0
                            ? 'text-[#E85D2F]'
                            : active
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-dimmer)]'
                        }`}
                        style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                      >
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
