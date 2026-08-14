'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TABS = [
  { id: 'submissions', label: 'Submissions' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'briefs', label: 'Client briefs' },
] as const;

export default function AdminTabs() {
  const searchParams = useSearchParams();
  const active = searchParams.get('tab') === 'sessions'
    ? 'sessions'
    : searchParams.get('tab') === 'briefs'
    ? 'briefs'
    : 'submissions';

  return (
    <div className="flex items-end mb-10 border-b border-[var(--border-base)]">
      {TABS.map((tab) => {
        const href = tab.id === 'submissions' ? '/admin' : `/admin?tab=${tab.id}`;
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 ${
              isActive
                ? 'text-[var(--text-primary)] border-[#E85D2F]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
