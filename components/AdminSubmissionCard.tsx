'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordDecision } from '@/app/briefs/actions';

type AdminSubmissionCardProps = {
  submissionId: string;
  briefId: string;
  projectName: string;
  composerEmail: string;
  status: string;
  existingFeedback: string | null;
  submittedAt: string;
  briefType?: 'client' | 'catalog';
  delivery?: 'upload' | 'disco';
  discoInboxUrl?: string | null;
  deliveryConfirmedAt?: string | null;
};

export default function AdminSubmissionCard({
  submissionId,
  briefId,
  projectName,
  composerEmail,
  status,
  existingFeedback,
  submittedAt,
  briefType = 'catalog',
  delivery = 'upload',
  discoInboxUrl = null,
  deliveryConfirmedAt = null,
}: AdminSubmissionCardProps) {
  const router = useRouter();
  const isDisco = delivery === 'disco';
  const isDecided = status === 'accepted' || status === 'not_accepted';
  const [open, setOpen] = useState(isDisco ? !deliveryConfirmedAt : !isDecided);
  const [feedback, setFeedback] = useState(existingFeedback ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOpen(isDisco ? !deliveryConfirmedAt : !isDecided);
  }, [isDisco, isDecided, status, deliveryConfirmedAt]);

  async function handleDecision(accepted: boolean) {
    if (!feedback.trim()) {
      setError('Feedback is required before recording a decision.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await recordDecision({ submissionId, accepted, feedback });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelivered(confirmed: boolean) {
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/admin/submissions/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, confirmed }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Could not update delivery.');
      return;
    }
    router.refresh();
  }

  const statusLabel = isDisco
    ? deliveryConfirmedAt
      ? 'Delivered'
      : 'Clicked through'
    : status === 'accepted'
      ? 'Accepted'
      : status === 'not_accepted'
        ? 'Reviewed'
        : 'Pending';

  const statusTone = isDisco
    ? deliveryConfirmedAt
      ? 'accepted'
      : 'pending'
    : status === 'accepted'
      ? 'accepted'
      : status === 'not_accepted'
        ? 'reviewed'
        : 'pending';

  return (
    <div
      className="border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
      style={{ borderRadius: '2px' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3
            className="text-xl mb-1 text-[var(--text-primary)]"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            Project <span className="italic">{projectName}</span>
          </h3>
          <div
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {briefType === 'client' ? 'Client' : 'Catalog'}
            {isDisco ? ' · Disco' : ''} · {composerEmail} · {submittedAt}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: '2px',
              background:
                statusTone === 'accepted'
                  ? 'rgba(122, 154, 110, 0.15)'
                  : statusTone === 'reviewed'
                  ? 'rgba(138, 134, 128, 0.15)'
                  : 'rgba(232, 163, 61, 0.15)',
              color:
                statusTone === 'accepted'
                  ? '#7A9A6E'
                  : statusTone === 'reviewed'
                  ? 'var(--text-muted)'
                  : '#E8A33D',
            }}
          >
            {statusLabel}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="text-[var(--text-dimmer)] mt-0.5 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href={`/browse/${briefId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              ↗ View Brief
            </a>
            {isDisco && discoInboxUrl && (
              <a
                href={discoInboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                ↗ Open Disco inbox
              </a>
            )}
          </div>

          {isDisco ? (
            <>
              <p
                className="text-sm text-[var(--text-muted)] leading-relaxed mb-4"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                This is a click-through to Disco, not an uploaded file. Mark it delivered once you see the track in the inbox.
              </p>
              {error && (
                <div
                  className="text-sm text-[#FF8B6B] mb-3"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {error}
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                {deliveryConfirmedAt ? (
                  <button
                    type="button"
                    onClick={() => handleDelivered(false)}
                    disabled={submitting}
                    className="text-xs tracking-[0.15em] uppercase px-5 py-2.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Undo delivered
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelivered(true)}
                    disabled={submitting}
                    className={`text-xs tracking-[0.15em] uppercase px-5 py-2.5 transition-colors ${
                      submitting
                        ? 'bg-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
                        : 'bg-[#7A9A6E] text-[var(--bg-base)] hover:bg-[#8BAB7E]'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Mark delivered
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Written feedback for the composer. This is included in the decision email."
                rows={4}
                className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm mb-3"
                style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
              />

              {error && (
                <div
                  className="text-sm text-[#FF8B6B] mb-3"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleDecision(true)}
                  disabled={submitting}
                  className={`text-xs tracking-[0.15em] uppercase px-5 py-2.5 transition-colors ${
                    submitting
                      ? 'bg-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
                      : 'bg-[#7A9A6E] text-[var(--bg-base)] hover:bg-[#8BAB7E]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                >
                  ◆ Accept
                </button>
                <button
                  onClick={() => handleDecision(false)}
                  disabled={submitting}
                  className={`text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-colors ${
                    submitting
                      ? 'border-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#FF8B6B] hover:text-[#FF8B6B]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Not Accepted
                </button>
                {isDecided && (
                  <span
                    className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-dimmer)] self-center"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Decision recorded · re-deciding re-sends the email
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
