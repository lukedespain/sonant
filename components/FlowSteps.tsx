'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconCheck } from '@/components/shell/icons';

export type FlowStep = {
  title: string;
  body: string;
  flow: string;
  href: string;
  /** Signed-in composers only: whether they have done this step yet. */
  done?: boolean;
};

/** The sidebar item a step points at, if the desktop sidebar is showing. */
function targetFor(flow: string) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-flow-target="${flow}"]`));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/**
 * "How it works" steps, doubling as a getting-started checklist when signed
 * in. On desktop, hovering a step runs a soft light around its card and the
 * matching sidebar item.
 */
export default function FlowSteps({ steps, checklist = false }: { steps: FlowStep[]; checklist?: boolean }) {
  const next = checklist ? steps.findIndex((s) => !s.done) : -1;
  const live = useRef<{ card: HTMLElement; target: HTMLElement | null } | null>(null);

  function stop() {
    const cur = live.current;
    if (!cur) return;
    delete cur.card.dataset.flowOn;
    if (cur.target) delete cur.target.dataset.flowOn;
    live.current = null;
  }

  function start(card: HTMLElement, flow: string) {
    stop();
    if (!window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) return;
    const target = targetFor(flow);
    card.dataset.flowOn = 'true';
    if (target) target.dataset.flowOn = 'true';
    live.current = { card, target };
  }

  // Leaving the page mid-hover must not leave the sidebar lit.
  useEffect(() => stop, []);

  return (
    <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {steps.map((step, i) => {
        const done = checklist && !!step.done;
        const isNext = i === next;
        return (
          <li key={step.flow}>
            <Link
              href={step.href}
              onMouseEnter={(e) => start(e.currentTarget, step.flow)}
              onMouseLeave={stop}
              className={`flow-ring h-full rounded-2xl border p-5 md:p-6 flex flex-col gap-2.5 transition-colors ${
                isNext
                  ? 'border-[var(--signal-line)] bg-[var(--bg-card)]'
                  : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[var(--text-dim)] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {checklist &&
                  (done ? (
                    <span className="w-6 h-6 rounded-full bg-[var(--positive)] text-[#0A0A0A] flex items-center justify-center" aria-label="Done">
                      <IconCheck size={13} strokeWidth={2.2} />
                    </span>
                  ) : isNext ? (
                    <span className="h-6 px-2.5 rounded-full bg-[var(--signal-soft)] text-[var(--signal)] text-[12px] font-medium flex items-center">
                      Next
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border border-[var(--border-subtle)]" aria-label="Not yet" />
                  ))}
              </span>
              <span className={`text-[17px] font-semibold tracking-[-0.02em] ${done ? 'text-[var(--text-muted)]' : ''}`}>{step.title}</span>
              <span className="text-[14px] text-[var(--text-muted)] leading-relaxed">{step.body}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
