'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RightsFields from '@/components/RightsFields';
import { validateRights, type RightsInfo } from '@/lib/handoff';
import { StatusPill, btn, inputClass } from '@/components/ui';
import { IconCheck } from '@/components/shell/icons';

export type Offer = {
  submissionId: string;
  briefName: string;
  trackName: string | null;
  catalogName: string;
  catalogDeal: string;
  terms: string[];
  humanMadeOnly: boolean;
};

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold tabular-nums transition-colors ${
          done ? 'bg-[var(--accent)] text-[#0A0A0A]' : 'border border-[var(--border-subtle)] text-[var(--text-muted)]'
        }`}
      >
        {done ? <IconCheck size={13} strokeWidth={2} /> : n}
      </span>
      <div className="min-w-0 pt-0.5">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] mb-3">{title}</h3>
        {children}
      </div>
    </section>
  );
}

const check = 'mt-0.5 w-4 h-4 shrink-0 accent-[var(--signal)]';

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
  const [noStems, setNoStems] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [humanMade, setHumanMade] = useState(!offer.humanMadeOnly);
  const ready = agreed && humanMade;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // The submission sheet's "Sign on to finish" button opens this card.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail === offer.submissionId) setExpanded(true);
    };
    window.addEventListener('tc:open-offer', onOpen);
    return () => window.removeEventListener('tc:open-offer', onOpen);
  }, [offer.submissionId]);

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
      body: JSON.stringify({ stemsUrl: noStems ? '' : stemsUrl, noStems, rights, agreed, humanMade }),
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
      <div id={`offer-${offer.submissionId}`} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 md:p-7">
        <StatusPill tone="positive">Signed on</StatusPill>
        <p className="mt-4 text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
          You are in. We have {trackLabel} and your stems, and it is going into the {offer.catalogName} catalogue now. Keep writing.
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div
        id={`offer-${offer.submissionId}`}
        className="scroll-mt-24 rounded-2xl border border-[var(--signal-line)] bg-[radial-gradient(120%_200%_at_0%_0%,var(--signal-soft),transparent_55%),var(--bg-card)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="min-w-0 flex-1">
          <StatusPill tone="signal" pulse>
            Accepted · sign to finish
          </StatusPill>
          <p className="mt-3 text-[18px] font-semibold tracking-[-0.02em]">
            {offer.catalogName} wants {trackLabel}.
          </p>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">
            Agree to the terms, check your rights info, and send stems. Takes two minutes.
          </p>
        </div>
        <button type="button" onClick={() => setExpanded(true)} className={btn('accent', 'lg', 'shrink-0')}>
          Sign on
        </button>
      </div>
    );
  }

  const infoDone = validateRights(rights) === null && !editingInfo;
  const stemsDone = noStems || /^https?:\/\/\S+/.test(stemsUrl);

  return (
    <form
      id={`offer-${offer.submissionId}`}
      onSubmit={send}
      className="scroll-mt-24 rounded-2xl border border-[var(--signal-line)] bg-[var(--bg-card)] overflow-hidden shadow-[0_0_0_4px_var(--signal-soft)]"
    >
      <div className="p-6 md:p-8 border-b border-[var(--border-base)] bg-[radial-gradient(120%_140%_at_0%_0%,var(--signal-soft),transparent_60%)]">
        <StatusPill tone="signal" pulse>Accepted · sign to finish</StatusPill>
        <h2 className="mt-4 text-[24px] md:text-[28px] font-semibold tracking-[-0.025em] leading-tight">
          {offer.catalogName} wants {trackLabel}.
        </h2>
        <p className="mt-2 text-[14px] text-[var(--text-muted)]">
          Written to {offer.briefName}. Three quick steps and it goes into the catalogue.
        </p>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-8">
        <Step n={1} title={`The terms · ${offer.catalogDeal}`} done={ready}>
          <ul className="space-y-1.5 mb-4">
            {offer.terms.map((term) => (
              <li key={term} className="flex gap-2.5 text-[14px] text-[var(--text-secondary)] leading-relaxed">
                <span className="mt-[9px] w-1 h-1 rounded-full bg-[var(--text-dim)] shrink-0" />
                <span>{term}</span>
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-3 cursor-pointer text-[14px]">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={check} />
            <span>I agree to {offer.catalogName}&apos;s terms for this track.</span>
          </label>
          {offer.humanMadeOnly && (
            <label className="mt-2.5 flex items-start gap-3 cursor-pointer text-[14px]">
              <input type="checkbox" checked={humanMade} onChange={(e) => setHumanMade(e.target.checked)} className={check} />
              <span>This track is fully human-made. No AI-generated music, stems, or vocals.</span>
            </label>
          )}
        </Step>

        <Step n={2} title="Your rights info" done={infoDone}>
          {editingInfo ? (
            <RightsFields value={rights} onChange={setRights} />
          ) : (
            <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-base)] px-4 py-3 flex items-start justify-between gap-4">
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                {rights.legalName} · {rights.pro} · IPI {rights.composerIpi}
                <br />
                <span className="text-[var(--text-muted)]">
                  {rights.publisherName
                    ? `${rights.publisherName}${rights.publisherIpi ? ` · IPI ${rights.publisherIpi}` : ''}`
                    : 'No publisher'}
                </span>
              </p>
              <button type="button" onClick={() => setEditingInfo(true)} className={btn('ghost', 'sm', 'px-3 -mr-2')}>
                Edit
              </button>
            </div>
          )}
        </Step>

        <Step n={3} title="Your stems" done={stemsDone}>
          <label htmlFor={`stems-${offer.submissionId}`} className="block text-[14px] text-[var(--text-muted)] leading-relaxed mb-3">
            A Dropbox, Google Drive, or WeTransfer link to a folder of WAV stems. Make sure anyone with the link can open it.
          </label>
          {!noStems && (
            <input
              id={`stems-${offer.submissionId}`}
              type="url"
              required
              placeholder="https://"
              value={stemsUrl}
              onChange={(e) => setStemsUrl(e.target.value)}
              className={inputClass}
            />
          )}
          <label className="mt-3 flex items-start gap-3 cursor-pointer text-[14px] text-[var(--text-muted)]">
            <input type="checkbox" checked={noStems} onChange={(e) => setNoStems(e.target.checked)} className={check} />
            <span>This track has no stems, like a solo piano piece. The full mix is all there is.</span>
          </label>
        </Step>
      </div>

      <div className="px-6 md:px-8 py-5 border-t border-[var(--border-base)] flex items-center gap-4 flex-wrap">
        <button type="submit" disabled={!ready || sending} className={btn('accent', 'lg')}>
          {sending ? 'Sending…' : `Sign on with ${offer.catalogName}`}
        </button>
        <button type="button" onClick={() => setExpanded(false)} className={btn('ghost', 'md')}>
          Later
        </button>
        {!ready && (
          <span className="text-[13px] text-[var(--text-dim)]">
            {agreed ? 'Confirm the track is human-made.' : 'Agree to the terms first.'}
          </span>
        )}
        {error && (
          <span role="alert" className="text-[13px] text-[var(--danger)]">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
