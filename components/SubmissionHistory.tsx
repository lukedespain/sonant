'use client';

import { useState } from 'react';
import Link from 'next/link';

export const SUBMISSION_STATUS: Record<string, { label: string; color: string }> = {
  received:       { label: 'Received',       color: 'var(--text-muted)' },
  in_review:      { label: 'In review',       color: '#E8B82F' },
  feedback_ready: { label: 'Feedback ready',  color: '#88B04B' },
  accepted:       { label: 'Accepted',        color: '#88B04B' },
  not_accepted:   { label: 'Not selected',    color: 'var(--text-muted)' },
};

export type SubmissionItem = {
  id: string;
  briefId: string;
  briefCodename: string;
  trackName?: string | null;
  briefType?: string;
  delivery?: 'upload' | 'disco';
  status: string;
  feedback: string | null;
  createdAt: string;
};

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function SubmissionHistory({ items }: { items: SubmissionItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <div
        className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
        style={{ borderRadius: '2px' }}
      >
        <h3
          className="text-2xl tracking-tight mb-4"
          style={{ ...serif, fontWeight: 300 }}
        >
          You haven&apos;t made any submissions yet.
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
          Open the Library and pick a brief to write to. Submissions only count when they&apos;re tied to a brief.
        </p>
        <Link
          href="/browse"
          className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
          style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
        >
          ◆ Open the Library
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border-base)]">
      {items.map((sub) => {
        const status = SUBMISSION_STATUS[sub.status] ?? { label: sub.status, color: 'var(--text-muted)' };
        const open = expanded.has(sub.id);
        const isClient = sub.briefType === 'client';

        return (
          <div key={sub.id} className="border-b border-[var(--border-base)] py-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    href={`/browse/${sub.briefId}`}
                    className="text-lg text-[var(--text-primary)] hover:text-[#E85D2F] transition-colors"
                    style={{ ...serif, fontWeight: 400 }}
                  >
                    {sub.briefCodename}
                  </Link>
                  <span
                    className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5"
                    style={{
                      ...mono,
                      borderRadius: '2px',
                      color: isClient ? '#92A8D1' : '#E85D2F',
                      background: isClient ? '#92A8D115' : '#E85D2F15',
                      border: `1px solid ${isClient ? '#92A8D130' : '#E85D2F30'}`,
                    }}
                  >
                    {isClient ? 'Client' : 'Catalog'}
                  </span>
                </div>
                {sub.trackName && (
                  <div className="text-sm text-[var(--text-secondary)] mb-1" style={sans}>
                    {sub.trackName}
                  </div>
                )}
                {sub.delivery === 'disco' && (
                  <div className="text-sm text-[var(--text-secondary)] mb-1" style={sans}>
                    Delivered via Disco
                  </div>
                )}
                <div className="text-[10px] text-[var(--text-dimmer)]" style={mono}>
                  Submitted {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ ...mono, color: status.color }}
                >
                  {status.label}
                </span>
                {sub.feedback && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(sub.id)) next.delete(sub.id);
                        else next.add(sub.id);
                        return next;
                      });
                    }}
                    className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors border border-[var(--border-card)] px-3 py-1.5"
                    style={{ ...mono, borderRadius: '2px' }}
                  >
                    {open ? 'Hide notes' : 'Written feedback'}
                  </button>
                )}
              </div>
            </div>

            {open && sub.feedback && (
              <div
                className="mt-5 border border-[var(--border-card)] bg-[var(--bg-card)] p-5"
                style={{ borderRadius: '2px' }}
              >
                <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3" style={mono}>
                  Written Feedback
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap" style={sans}>
                  {sub.feedback}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
