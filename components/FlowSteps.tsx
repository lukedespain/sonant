'use client';

import { useEffect, useRef, useState } from 'react';

export type FlowStep = { title: string; body: string; flow: string };

type Line = { d: string; end: { x: number; y: number } };

/** The sidebar item a step points at, if the desktop sidebar is showing. */
function targetFor(flow: string) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-flow-target="${flow}"]`));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/**
 * "How it works" steps. On desktop, hovering a step lights its card and the
 * matching sidebar item, joined by a moving line.
 */
export default function FlowSteps({ steps }: { steps: FlowStep[] }) {
  const [line, setLine] = useState<Line | null>(null);
  const live = useRef<{ card: HTMLElement; target: HTMLElement | null; update: () => void } | null>(null);

  function draw(card: HTMLElement, target: HTMLElement | null) {
    if (!target || !window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
      setLine(null);
      return;
    }
    const c = card.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sx = c.left;
    const sy = c.top + Math.min(36, c.height / 2);
    const ex = t.right + 8;
    const ey = t.top + t.height / 2;
    const bend = Math.max(60, (sx - ex) * 0.45);
    setLine({ d: `M ${sx} ${sy} C ${sx - bend} ${sy}, ${ex + bend} ${ey}, ${ex} ${ey}`, end: { x: ex, y: ey } });
  }

  function stop() {
    const cur = live.current;
    if (!cur) return;
    delete cur.card.dataset.flowOn;
    if (cur.target) delete cur.target.dataset.flowOn;
    window.removeEventListener('scroll', cur.update);
    window.removeEventListener('resize', cur.update);
    live.current = null;
    setLine(null);
  }

  function start(card: HTMLElement, flow: string) {
    stop();
    const target = targetFor(flow);
    card.dataset.flowOn = 'true';
    if (target) target.dataset.flowOn = 'true';
    const update = () => draw(card, target);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    live.current = { card, target, update };
    draw(card, target);
  }

  // Leaving the page mid-hover must not leave the sidebar lit.
  useEffect(() => stop, []);

  return (
    <>
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
      {line && (
        <svg className="pointer-events-none fixed inset-0 z-40 w-screen h-screen animate-fade" aria-hidden="true">
          <path d={line.d} fill="none" stroke="var(--signal)" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
          <path d={line.d} fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeLinecap="round" className="flow-line" />
          <circle cx={line.end.x} cy={line.end.y} r="4" fill="var(--signal)" />
        </svg>
      )}
    </>
  );
}
