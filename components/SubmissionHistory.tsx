'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { EmptyState, StatusPill, btn, type Tone } from '@/components/ui';
import {
  IconBriefs,
  IconCheck,
  IconChevronRight,
  IconClose,
  IconMessage,
  IconWaveform,
} from '@/components/shell/icons';

export type SubmissionItem = {
  id: string;
  briefId: string;
  briefCodename: string;
  briefImage?: string | null;
  trackName?: string | null;
  briefType?: string;
  delivery?: 'upload' | 'disco';
  status: string;
  feedback: string | null;
  createdAt: string;
  /** Accepted, but the composer still has to sign on. */
  needsSignature?: boolean;
};

type Filter = 'all' | 'review' | 'accepted' | 'closed';

const REVIEW = new Set(['received', 'pending', 'in_review', 'feedback_ready', 'sent_to_catalog']);

export function isProject(sub: Pick<SubmissionItem, 'briefType'>) {
  return sub.briefType === 'client';
}

export function composerStatus(
  sub: Pick<SubmissionItem, 'status' | 'needsSignature'> & { briefType?: string },
): { label: string; tone: Tone; pulse?: boolean } {
  if (sub.briefType === 'client') {
    if (sub.status === 'accepted') return { label: 'Picked by the client', tone: 'positive' };
    if (sub.status === 'not_accepted') return { label: 'Not picked', tone: 'muted' };
    if (sub.status === 'sent_to_catalog') return { label: 'Sent to the client', tone: 'info' };
    return { label: 'With our team', tone: 'warning' };
  }
  if (sub.status === 'accepted') {
    return sub.needsSignature
      ? { label: 'Sign to finish', tone: 'signal', pulse: true }
      : { label: 'Accepted', tone: 'positive' };
  }
  if (sub.status === 'not_accepted') return { label: 'Not selected', tone: 'muted' };
  if (sub.status === 'sent_to_catalog') return { label: 'Shortlisted', tone: 'info' };
  if (sub.status === 'feedback_ready') return { label: 'Feedback ready', tone: 'info' };
  return { label: 'In review', tone: 'warning' };
}

function trackTitle(sub: SubmissionItem) {
  if (sub.trackName) return sub.trackName.replace(/\.[^/.]+$/, '');
  if (sub.delivery === 'disco') return 'Delivered via Disco';
  return 'Untitled track';
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


function Artwork({ sub, size = 40 }: { sub: SubmissionItem; size?: number }) {
  return (
    <span
      className="relative shrink-0 rounded-lg overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-dim)]"
      style={{ width: size, height: size }}
    >
      {sub.briefImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sub.briefImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <IconWaveform size={Math.round(size * 0.4)} />
      )}
    </span>
  );
}

export default function SubmissionHistory({ items }: { items: SubmissionItem[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      review: items.filter((s) => REVIEW.has(s.status)).length,
      accepted: items.filter((s) => s.status === 'accepted').length,
      closed: items.filter((s) => s.status === 'not_accepted').length,
    }),
    [items],
  );

  const visible = items.filter((s) =>
    filter === 'all'
      ? true
      : filter === 'review'
        ? REVIEW.has(s.status)
        : filter === 'accepted'
          ? s.status === 'accepted'
          : s.status === 'not_accepted',
  );
  const open = items.find((s) => s.id === openId) ?? null;

  // Alerts and emails link to /dashboard#submission-<id>: open that track.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.match(/^#submission-(.+)$/)?.[1];
      if (id && items.some((s) => s.id === id)) setOpenId(id);
    };
    const timer = window.setTimeout(openFromHash, 0);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconWaveform size={18} />}
        title="No submissions yet"
        body="Pick a brief, write to it, and submit your track. It shows up here with its status and our feedback."
        action={
          <Link href="/briefs" className={btn('primary', 'md')}>
            Browse briefs
          </Link>
        }
      />
    );
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'review', label: 'In review' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'closed', label: 'Not selected' },
  ];

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 overflow-x-auto [scrollbar-width:none] -mx-1 px-1" role="tablist">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                active
                  ? 'bg-[var(--accent)] text-[#0A0A0A] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]'
              }`}
            >
              {f.label}
              <span className={`tabular-nums ${active ? 'text-[#0A0A0A]/60' : 'text-[var(--text-dimmer)]'}`}>
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_150px_24px] gap-4 px-5 h-10 items-center border-b border-[var(--border-base)] text-[12px] text-[var(--text-dim)]">
          <span>Track</span>
          <span>Brief</span>
          <span>Submitted</span>
          <span>Status</span>
          <span />
        </div>

        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-[var(--text-muted)]">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-base)]">
            {visible.map((sub) => {
              const status = composerStatus(sub);
              return (
                <li key={sub.id} id={`submission-${sub.id}`} className="scroll-mt-28">
                  <button
                    type="button"
                    onClick={() => setOpenId(sub.id)}
                    className="row-hover w-full text-left px-4 md:px-5 py-3.5 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_150px_24px] gap-x-4 gap-y-1 items-center"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Artwork sub={sub} />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium truncate">{trackTitle(sub)}</span>
                        <span className="block md:hidden text-[12px] text-[var(--text-dim)] truncate">
                          {sub.briefCodename} · {shortDate(sub.createdAt)}
                        </span>
                        {sub.feedback && (
                          <span className="hidden md:inline-flex items-center gap-1 text-[12px] text-[var(--text-dim)]">
                            <IconMessage size={12} /> Feedback
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="hidden md:block min-w-0">
                      <span className="block text-[14px] text-[var(--text-secondary)] truncate">{sub.briefCodename}</span>
                      {isProject(sub) && <span className="block text-[12px] text-[var(--text-dim)]">Client project</span>}
                    </span>
                    <span className="hidden md:block text-[13px] text-[var(--text-muted)] tabular-nums">
                      {shortDate(sub.createdAt)}
                    </span>
                    <span className="justify-self-end md:justify-self-start">
                      <StatusPill tone={status.tone} pulse={status.pulse}>
                        {status.label}
                      </StatusPill>
                    </span>
                    <span className="hidden md:flex justify-end text-[var(--text-dimmer)]">
                      <IconChevronRight size={14} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {open && <SubmissionSheet sub={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

type Step = { label: string; detail?: string; state: 'done' | 'current' | 'upcoming' | 'stopped' };

function stepsFor(sub: SubmissionItem): Step[] {
  if (isProject(sub)) {
    const sent = sub.status === 'sent_to_catalog' || sub.status === 'accepted' || sub.status === 'not_accepted';
    return [
      { label: 'Uploaded', detail: shortDate(sub.createdAt), state: 'done' },
      {
        label: 'Our team listens',
        detail: sent ? 'Done' : 'Notes come back in the project thread.',
        state: sent ? 'done' : 'current',
      },
      {
        label: 'Sent to the client',
        state: sent ? (sub.status === 'sent_to_catalog' ? 'current' : 'done') : 'upcoming',
        detail: sub.status === 'sent_to_catalog' ? 'Waiting on their call.' : undefined,
      },
      sub.status === 'accepted'
        ? { label: 'Picked by the client', state: 'done' }
        : sub.status === 'not_accepted'
          ? { label: 'Not picked this time', state: 'stopped' }
          : { label: 'Client decision', state: 'upcoming' },
    ];
  }
  const decided = sub.status === 'accepted' || sub.status === 'not_accepted';
  const steps: Step[] = [
    { label: 'Submitted', detail: shortDate(sub.createdAt), state: 'done' },
    {
      label: 'Listened to against the brief',
      detail: decided || sub.status === 'sent_to_catalog' ? 'Done' : 'We listen to every track. This usually takes a week or two.',
      state: decided || sub.status === 'sent_to_catalog' ? 'done' : 'current',
    },
  ];
  if (sub.status === 'sent_to_catalog') {
    steps.push({ label: 'Shortlisted for the catalogue', detail: 'Waiting on the final call.', state: 'current' });
  }
  steps.push(
    sub.status === 'accepted'
      ? { label: 'Accepted into the catalogue', state: 'done' }
      : sub.status === 'not_accepted'
        ? { label: 'Not selected this time', detail: 'Read the notes, then try another brief.', state: 'stopped' }
        : { label: 'Decision', state: 'upcoming' },
  );
  if (sub.status === 'accepted') {
    steps.push(
      sub.needsSignature
        ? { label: 'Sign on', detail: 'Confirm your details and send stems to finish.', state: 'current' }
        : { label: 'Signed on', detail: 'You are on the roster.', state: 'done' },
    );
  }
  return steps;
}

function SubmissionSheet({ sub, onClose }: { sub: SubmissionItem; onClose: () => void }) {
  const status = composerStatus(sub);
  const steps = stepsFor(sub);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [onClose]);

  function goToOffer() {
    window.dispatchEvent(new CustomEvent('tc:open-offer', { detail: sub.id }));
    onClose();
    window.setTimeout(() => {
      const target = document.getElementById(`offer-${sub.id}`) ?? document.getElementById('offers');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={trackTitle(sub)}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 animate-fade" />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[460px] bg-[var(--bg-sidebar)] border-l border-[var(--border-card)] flex flex-col animate-sheet">
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-base)] shrink-0">
          <StatusPill tone={status.tone} pulse={status.pulse}>
            {status.label}
          </StatusPill>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto app-scroll px-6 py-7">
          <div className="flex items-start gap-4">
            <Artwork sub={sub} size={56} />
            <div className="min-w-0">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-snug break-words">{trackTitle(sub)}</h2>
              <Link
                href={`/briefs/${sub.briefId}`}
                className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <IconBriefs size={13} />
                {sub.briefCodename}
              </Link>
            </div>
          </div>

          <ol className="mt-9 relative">
            {steps.map((step, i) => {
              const last = i === steps.length - 1;
              return (
                <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && (
                    <span
                      className={`absolute left-[11px] top-6 bottom-0 w-px ${
                        step.state === 'done' ? 'bg-[var(--border-hover)]' : 'bg-[var(--border-card)]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative z-10 w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0 ${
                      step.state === 'done'
                        ? 'bg-[var(--accent)] text-[#0A0A0A]'
                        : step.state === 'current'
                          ? 'bg-[var(--signal-soft)] border border-[var(--signal-line)]'
                          : step.state === 'stopped'
                            ? 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
                            : 'bg-[var(--bg-base)] border border-[var(--border-card)]'
                    }`}
                  >
                    {step.state === 'done' && <IconCheck size={12} strokeWidth={2} />}
                    {step.state === 'current' && <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />}
                    {step.state === 'stopped' && <IconClose size={10} strokeWidth={2} />}
                  </span>
                  <div className="pt-0.5 min-w-0">
                    <p
                      className={`text-[14px] font-medium ${
                        step.state === 'upcoming' ? 'text-[var(--text-dim)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.detail && <p className="mt-0.5 text-[13px] text-[var(--text-muted)] leading-relaxed">{step.detail}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {sub.feedback && (
            <div className="mt-9">
              <p className="text-[13px] text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5">
                <IconMessage size={13} /> Notes from Thought Collective
              </p>
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{sub.feedback}</p>
              </div>
            </div>
          )}

          {isProject(sub) && sub.status === 'not_accepted' && (
            <div className="mt-9 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
              <p className="text-[14px] font-medium">Give it another life</p>
              <p className="mt-1 text-[13px] text-[var(--text-muted)] leading-relaxed">
                The client went another way, but the track is still yours. If it fits one of our catalogue briefs, submit it there. It might be right for the next project.
              </p>
              <Link href="/briefs" className={btn('secondary', 'sm', 'mt-4')}>
                Browse catalogue briefs
              </Link>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-base)] flex gap-2 shrink-0">
          {sub.needsSignature ? (
            <button type="button" onClick={goToOffer} className={btn('accent', 'md', 'flex-1')}>
              Sign on to finish
            </button>
          ) : isProject(sub) ? (
            <Link href={`/projects/${sub.briefId}`} className={btn('primary', 'md', 'flex-1')}>
              Open project
            </Link>
          ) : (
            <Link href="/briefs" className={btn('primary', 'md', 'flex-1')}>
              Find the next brief
            </Link>
          )}
          {!isProject(sub) && (
            <Link href={`/briefs/${sub.briefId}`} className={btn('secondary', 'md')}>
              Open brief
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
