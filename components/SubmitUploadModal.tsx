'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/lib/upload-client';

type Props = {
  trackId: string;
  trackName: string;
  briefName: string;
  submissionCredits?: number;
  isAdmin?: boolean;
};

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function SubmitUploadModal({
  trackId,
  trackName,
  briefName,
  submissionCredits = 0,
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const hasCredit = isAdmin || submissionCredits > 0;

  function handleOpen() {
    setOpen(true);
    setConfirmed(false);
    setError(null);
    setDone(false);
  }

  function handleClose() {
    if (submitting) return;
    setOpen(false);
  }

  async function handleSubmit() {
    if (!confirmed || !hasCredit) return;
    setSubmitting(true);
    setError(null);
    try {
      await postJson('/api/submissions/from-upload', { communityTrackId: trackId });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="shrink-0 px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        Submit to catalog
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(10, 9, 8, 0.85)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-card)] p-8"
            style={{ borderRadius: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4">
                <div className="text-3xl text-[#E85D2F] mb-4">◆</div>
                <h2 className="text-2xl mb-3" style={{ ...serif, fontWeight: 300 }}>
                  Track submitted.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={sans}>
                  Your track is in. You&apos;ll receive written feedback regardless of outcome. Status lives under My Submissions.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs tracking-[0.2em] uppercase px-6 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                  style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                >
                  ◆ Done
                </button>
              </div>
            ) : (
              <>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={mono}>
                  ◆ Submit to catalog
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
                      Track
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]" style={sans}>{trackName}</p>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
                      Brief
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]" style={sans}>{briefName}</p>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
                      Credits
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]" style={sans}>
                      {isAdmin
                        ? 'Sonant team · no credit used'
                        : `${submissionCredits} ${submissionCredits === 1 ? 'credit' : 'credits'} remaining · this uses 1`}
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                          confirmed ? 'bg-[#E85D2F] border-[#E85D2F]' : 'border-[var(--border-subtle)] group-hover:border-[#E85D2F]'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {confirmed && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] leading-relaxed" style={sans}>
                      I understand this uses 1 submission credit. This goes privately to the Sonant team, not onto the playlist.
                    </span>
                  </label>
                </div>

                {!hasCredit && (
                  <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed" style={sans}>
                    You need a submission credit to send this in.{' '}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'submission' }),
                        });
                        if (res.ok) {
                          const { url } = await res.json();
                          window.location.href = url;
                        }
                      }}
                      className="text-[#E85D2F] hover:opacity-70"
                    >
                      Buy a credit
                    </button>
                    .
                  </p>
                )}

                {error && (
                  <p className="text-[10px] text-[#FF8B6B] mt-4 leading-relaxed" style={mono}>
                    × {error}
                  </p>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!confirmed || !hasCredit || submitting}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    {submitting ? '◆ Submitting…' : '◆ Submit Track'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
                    style={{ ...mono, borderRadius: '2px' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
