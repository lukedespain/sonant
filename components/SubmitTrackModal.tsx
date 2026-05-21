'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitTrack } from '@/app/briefs/actions';

const DISCO_UPLOAD_URL = 'https://s.disco.ac/nxbvoeqnhhxu';

type SubmitTrackModalProps = {
  briefId: string;
  projectName: string;
  alreadySubmitted: boolean;
};

export default function SubmitTrackModal({
  briefId,
  projectName,
  alreadySubmitted,
}: SubmitTrackModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await submitTrack(briefId);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        ↗ Submit a Track to This Brief
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(10, 9, 8, 0.85)' }}
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-lg border border-[#2A2826] bg-[#141312] p-8"
            style={{ borderRadius: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ Submit a Track
            </div>

            <h2
              className="text-2xl mb-4 leading-tight text-[#F5F1E8]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
            >
              Submitting for <span className="italic">{projectName}</span>
            </h2>

            {alreadySubmitted && (
              <div
                className="text-xs text-[#C4BFB5] border border-[#3A3835] bg-[#0A0908] p-3 mb-5"
                style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
              >
                You&apos;ve already submitted a track for this brief. You can submit
                another, and it will be reviewed as a separate entry.
              </div>
            )}

            <p
              className="text-sm text-[#A8A39A] leading-relaxed mb-5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Tracks are uploaded through our Disco inbox. Follow these steps:
            </p>

            <ol className="space-y-3 mb-6">
              <Step n="1" text="Open the upload page using the button below." />
              <Step n="2" text="Enter your name and the same email you use for Sonant. This is how your track gets matched to your account." />
              <Step n={'3'} text={`Set the playlist name to "${projectName}" so it links to this brief.`} />
              <Step n="4" text="Drag in your finished track, then click Send files." />
              <Step n="5" text="Come back here and confirm your submission below." />
            </ol>

            
              <a href={DISCO_UPLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-xs tracking-[0.15em] uppercase px-6 py-3 border border-[#E85D2F] text-[#E85D2F] hover:bg-[#E85D2F]/10 transition-colors mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              ↗ Open the Upload Page
            </a>
<p
              className="text-xs text-[#8A8680] leading-relaxed mb-4"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              ◆ You keep full ownership. Non-exclusive, no fees. Placements split
              70/30 in your favor.{' '}
              
                <a href="/submissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors"
              >
                Full details →
              </a>
            </p>
            {error && (
              <div
                className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3 mb-3"
                style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`flex-1 text-xs tracking-[0.15em] uppercase px-6 py-3 transition-colors ${
                  submitting
                    ? 'bg-[#1F1D1A] text-[#5A5650] cursor-not-allowed'
                    : 'bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                {submitting ? '◆ Recording…' : "◆ I've Uploaded My Track"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="text-xs tracking-[0.15em] uppercase px-6 py-3 border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className="text-[10px] tracking-[0.2em] text-[#E85D2F] mt-1 shrink-0"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        0{n}
      </span>
      <span
        className="text-sm text-[#C4BFB5] leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {text}
      </span>
    </li>
  );
}