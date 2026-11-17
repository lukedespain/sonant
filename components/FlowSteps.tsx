'use client';

import { useEffect, useRef } from 'react';

export type FlowStep = { title: string; body: string; flow: string };

/** The sidebar item a step points at, if the desktop sidebar is showing. */
function targetFor(flow: string) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-flow-target="${flow}"]`));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/**
 * "How it works" steps. On desktop, hovering a step runs a soft light around
 * its card and the matching sidebar item.
 */
export default function FlowSteps({ steps }: { steps: FlowStep[] }) {
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
      {steps.map((step, i) => (
        <li
          key={step.flow}
          onMouseEnter={(e) => start(e.currentTarget, step.flow)}
          onMouseLeave={stop}
          className="flow-ring rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 md:p-6 flex flex-col gap-2.5 transition-colors"
        >
          <span className="text-[13px] text-[var(--text-dim)] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-[17px] font-semibold tracking-[-0.02em]">{step.title}</span>
          <span className="text-[14px] text-[var(--text-muted)] leading-relaxed">{step.body}</span>
        </li>
      ))}
    </ol>
  );
}
