'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordDecision } from '@/app/briefs/actions';

type AdminSubmissionCardProps = {
  submissionId: string;
  projectName: string;
  composerEmail: string;
  status: string;
  existingFeedback: string | null;
  submittedAt: string;
};

export default function AdminSubmissionCard({
  submissionId,
  projectName,
  composerEmail,
  status,
  existingFeedback,
  submittedAt,
}: AdminSubmissionCardProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(existingFeedback ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDecided = status === 'accepted' || status === 'not_accepted';

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
    router.refresh();
  }

  return (
    <div
      className="border border-[#2A2826] bg-[#141312] p-6"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3
            className="text-xl mb-1 text-[#F5F1E8]"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            Project <span className="italic">{projectName}</span>
          </h3>
          <div
            className="text-[10px] tracking-[0.2em] uppercase text-[#8A8680]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {composerEmail} · {submittedAt}
          </div>
        </div>
        <span
          className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: '2px',
            background:
              status === 'accepted'
                ? 'rgba(122, 154, 110, 0.15)'
                : status === 'not_accepted'
                ? 'rgba(138, 134, 128, 0.15)'
                : 'rgba(232, 163, 61, 0.15)',
            color:
              status === 'accepted'
                ? '#7A9A6E'
                : status === 'not_accepted'
                ? '#8A8680'
                : '#E8A33D',
          }}
        >
          {status === 'accepted'
            ? 'Accepted'
            : status === 'not_accepted'
            ? 'Reviewed'
            : 'Pending'}
        </span>
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Written feedback for the composer. This is included in the decision email."
        rows={4}
        className="w-full px-4 py-3 bg-[#0A0908] border border-[#2A2826] text-[#F5F1E8] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm mb-3"
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
              ? 'bg-[#1F1D1A] text-[#5A5650] cursor-not-allowed'
              : 'bg-[#7A9A6E] text-[#0A0908] hover:bg-[#8BAB7E]'
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
              ? 'border-[#1F1D1A] text-[#5A5650] cursor-not-allowed'
              : 'border-[#3A3835] text-[#C4BFB5] hover:border-[#FF8B6B] hover:text-[#FF8B6B]'
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
        >
          Not Accepted
        </button>
        {isDecided && (
          <span
            className="text-[10px] tracking-[0.15em] uppercase text-[#5A5650] self-center"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Decision recorded · re-deciding re-sends the email
          </span>
        )}
      </div>
    </div>
  );
}