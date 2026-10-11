'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TABS = [
  { id: 'submissions', label: 'Submissions' },
  { id: 'briefs', label: 'Briefs' },
  { id: 'houses', label: 'Houses' },
  { id: 'people', label: 'People' },
] as const;

export default function AdminTabs() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const active = tab === 'briefs' || tab === 'people' || tab === 'houses' ? tab : 'submissions';

  return (
    <nav className="flex items-end mb-10 border-b border-[var(--border-base)] overflow-x-auto [scrollbar-width:none]">
      {TABS.map((t) => {
        const href = t.id === 'submissions' ? '/admin' : `/admin?tab=${t.id}`;
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`px-4 md:px-5 py-3 label whitespace-nowrap transition-colors -mb-px border-b-2 ${
              isActive
                ? 'text-[var(--text-primary)] border-[var(--accent)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
