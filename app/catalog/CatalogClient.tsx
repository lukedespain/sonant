'use client';

import Link from 'next/link';
import SubmissionHistory, { type SubmissionItem } from '@/components/SubmissionHistory';
import { THOUGHT_COLLECTIVE_CATALOG } from '@/lib/partners';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function CatalogClient({
  submissions,
  loggedIn,
}: {
  submissions: SubmissionItem[];
  loggedIn: boolean;
}) {
  return (
    <>
      <div className="mb-10 max-w-2xl">
        <h1
          className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4"
          style={{ ...serif, fontWeight: 300 }}
        >
          Catalog.
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={sans}>
          Your submissions and their status. Thought Collective is our partner for pitching accepted tracks for sync licensing opportunities.
        </p>
        <a
          href={THOUGHT_COLLECTIVE_CATALOG}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
          style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
        >
          ◆ Thought Collective catalog
        </a>
      </div>

      <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed mb-8" style={sans}>
        Status and written notes on tracks you have sent in. Accepted catalog tracks are the ones Thought Collective pitches.
      </p>
      {loggedIn ? <SubmissionHistory items={submissions} /> : <SignInCard />}
    </>
  );
}

function SignInCard() {
  return (
    <div
      className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
      style={{ borderRadius: '2px' }}
    >
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
        Sign in to see the tracks you have submitted, their status, and any written feedback.
      </p>
      <Link
        href="/login?redirect=/catalog"
        className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        ◆ Sign In
      </Link>
    </div>
  );
}
