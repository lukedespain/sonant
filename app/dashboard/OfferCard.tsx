'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RightsFields from '@/components/RightsFields';
import { validateRights, type RightsInfo } from '@/lib/handoff';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export type Offer = {
  submissionId: string;
  briefName: string;
  trackName: string | null;
  catalogName: string;
  catalogDeal: string;
  terms: string[];
};

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="text-[#E85D2F] text-sm" style={serif}>{n}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-secondary)]" style={mono}>{children}</span>
    </div>
  );
}

export default function OfferCard({
  offer,
  rights: savedRights,
  onRightsSaved,
}: {
  offer: Offer;
  rights: RightsInfo;
  onRightsSaved: (rights: RightsInfo) => void;
}) {
  const router = useRouter();
  const [rights, setRights] = useState(savedRights);
  const [editingInfo, setEditingInfo] = useState(validateRights(savedRights) !== null);
  const [stemsUrl, setStemsUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const trackLabel = offer.trackName?.replace(/\.[^/.]+$/, '') || 'your track';

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateRights(rights);
    if (problem) {
      setEditingInfo(true);
      setError(problem);
      return;
    }
    setSending(true);
    setError(null);
    const res = await fetch(`/api/submissions/${offer.submissionId}/agree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stemsUrl, rights, agreed }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!res.ok) {
      setError(json.error ?? 'Could not send. Try again.');
      return;
    }
    onRightsSaved(rights);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="border border-[#7A9A6E]/40 bg-[var(--bg-card)] p-8" style={{ borderRadius: '2px' }}>
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#7A9A6E] mb-3" style={mono}>◆ Signed on</div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed" style={sans}>
          You are in. Sonant is handing {trackLabel} and your stems to {offer.catalogName} now. Keep in touch, and keep writing.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={send}
      className="border border-[#E85D2F]/40 bg-[var(--bg-card)]"
      style={{ borderRadius: '2px' }}
    >
      <div className="p-8 md:p-10 border-b border-[var(--border-card)]">
        <div className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] mb-4" style={mono}>
          ◆ Congratulations
        </div>
        <h2 className="text-3xl md:text-4xl tracking-tight leading-tight mb-3" style={{ ...serif, fontWeight: 300 }}>
          {offer.catalogName} wants <span className="italic">{trackLabel}</span>.
        </h2>
        <p className="text-sm text-[var(--text-muted)]" style={sans}>
          Written to {offer.briefName}. Three steps and it goes into their catalog.
        </p>
      </div>

      <div className="p-8 md:p-10 flex flex-col gap-10">
        <section>
          <StepLabel n={1}>Their terms · {offer.catalogDeal}</StepLabel>
          <ul className="space-y-2 mb-5">
            {offer.terms.map((term) => (
              <li key={term} className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={sans}>
                <span className="text-[#E85D2F]">·</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#E85D2F]"
            />
            <span className="text-sm text-[var(--text-primary)]" style={sans}>
              I agree to {offer.catalogName}&apos;s terms for this track.
            </span>
          </label>
        </section>

        <section>
          <StepLabel n={2}>Your info</StepLabel>
          {editingInfo ? (
            <RightsFields value={rights} onChange={setRights} />
          ) : (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed" style={sans}>
                {rights.legalName} · {rights.pro} · IPI {rights.composerIpi}
                <br />
                {rights.publisherName ? `${rights.publisherName}${rights.publisherIpi ? ` · IPI ${rights.publisherIpi}` : ''}` : 'No publisher'}
              </p>
              <button
                type="button"
                onClick={() => setEditingInfo(true)}
                className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
                style={mono}
              >
                Edit
              </button>
            </div>
          )}
        </section>

        <section>
          <StepLabel n={3}>Your stems</StepLabel>
          <label htmlFor={`stems-${offer.submissionId}`} className="block text-sm text-[var(--text-muted)] mb-3" style={sans}>
            A Dropbox, Google Drive, or WeTransfer link to a folder of WAV stems. Make sure anyone with the link can open it.
          </label>
          <input
            id={`stems-${offer.submissionId}`}
            type="url"
            required
            placeholder="https://"
            value={stemsUrl}
            onChange={(e) => setStemsUrl(e.target.value)}
            className="w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
            style={{ ...sans, borderRadius: '2px' }}
          />
        </section>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={!agreed || sending}
            className="px-6 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
          >
            {sending ? 'Sending…' : `◆ Sign on with ${offer.catalogName}`}
          </button>
          {!agreed && (
            <span className="text-[11px] text-[var(--text-dimmer)]" style={sans}>Agree to the terms first.</span>
          )}
          {error && <span role="alert" className="text-[11px] text-[#FF8B6B]" style={sans}>{error}</span>}
        </div>
      </div>
    </form>
  );
}
