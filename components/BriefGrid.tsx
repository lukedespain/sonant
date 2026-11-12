'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type BriefCard = {
  id: string;
  title: string;
  logline: string;
  imageUrl: string | null;
  mode: string;
  genres: string[];
  createdAt: string;
  closed?: boolean;
};

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film', games: 'Games' };

/** Image-first grid in the style of the "All Works" page on wearethoughtcollective.com. */
export default function BriefGrid({
  briefs,
  showTabs = true,
  emptyText = 'No open briefs right now. New ones land here first.',
}: {
  briefs: BriefCard[];
  showTabs?: boolean;
  emptyText?: string;
}) {
  const modes = useMemo(() => [...new Set(briefs.map((b) => b.mode).filter((m) => MODE_LABELS[m]))], [briefs]);
  const [mode, setMode] = useState('');
  const visible = mode ? briefs.filter((b) => b.mode === mode) : briefs;

  return (
    <div>
      {showTabs && modes.length > 1 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 text-[17px] md:text-[19px] tracking-[-0.01em]" role="tablist">
          {[{ value: '', label: 'All briefs' }, ...modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))].map((tab) => {
            const active = mode === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.value)}
                className={`pb-1 border-b transition-colors ${
                  active
                    ? 'text-[var(--text-primary)] border-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-[17px] text-[var(--text-muted)] py-10">{emptyText}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-14">
          {visible.map((brief) => (
            <li key={brief.id}>
              <Link href={`/briefs/${brief.id}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-card)]">
                  {brief.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brief.imageUrl}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${
                        brief.closed ? 'grayscale opacity-50' : ''
                      }`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-end p-6">
                      <span className="text-4xl font-medium tracking-[-0.04em] text-[var(--text-dimmer)]">{brief.title}</span>
                    </div>
                  )}
                  {brief.closed && (
                    <span className="absolute top-4 left-4 text-[13px] px-2.5 py-1 bg-[var(--bg-base)] text-[var(--text-muted)]">
                      Closed
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[19px] md:text-[21px] tracking-[-0.02em] leading-snug">{brief.title}</p>
                <p className="mt-1 text-[15px] text-[var(--text-muted)] truncate">
                  {[MODE_LABELS[brief.mode], ...brief.genres.slice(0, 3)].filter(Boolean).join(' · ')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
