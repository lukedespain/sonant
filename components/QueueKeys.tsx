'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Keyboard shortcuts for the review queue: J/K move, Space plays, A accepts,
 * X passes, Enter opens. Rows mark themselves with data-queue-row and their
 * buttons with data-action.
 */
export default function QueueKeys({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    const rows = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-queue-row]') ?? []);
    rows().forEach((row, i) => (row.dataset.active = String(i === index)));
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey)) return;
      const rows = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-queue-row]') ?? []);
      if (rows.length === 0) return;
      const key = e.key.toLowerCase();
      const move = (next: number) => {
        const i = Math.max(0, Math.min(rows.length - 1, next));
        setIndex(i);
        rows[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      if (key === 'j') return move(index + 1);
      if (key === 'k') return move(index < 0 ? 0 : index - 1);
      const row = rows[index];
      if (!row) return;
      const click = (action: string) => row.querySelector<HTMLElement>(`[data-action="${action}"]`)?.click();
      if (key === ' ') {
        e.preventDefault();
        click('play');
      } else if (key === 'a') {
        click('accept');
      } else if (key === 'x') {
        click('pass');
      } else if (key === 'enter') {
        click('toggle');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index]);

  return (
    <div ref={ref}>
      <p className="hidden md:flex items-center gap-3 mb-4 text-[12px] text-[var(--text-dim)]">
        {[
          ['J', 'K', 'move'],
          ['Space', '', 'play'],
          ['A', '', 'accept'],
          ['X', '', 'pass'],
        ].map(([a, b, label]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <kbd className="min-w-5 h-5 px-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] text-[var(--text-secondary)] font-sans inline-flex items-center justify-center">{a}</kbd>
            {b && <kbd className="min-w-5 h-5 px-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] text-[var(--text-secondary)] font-sans inline-flex items-center justify-center">{b}</kbd>}
            {label}
          </span>
        ))}
      </p>
      {children}
    </div>
  );
}
