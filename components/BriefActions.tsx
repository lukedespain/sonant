'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { btn } from '@/components/ui';

/** Prints only the brief document (see the data-print-brief rule in globals.css). */
export function printBrief() {
  document.body.dataset.printBrief = '';
  const clear = () => {
    delete document.body.dataset.printBrief;
    window.removeEventListener('afterprint', clear);
  };
  window.addEventListener('afterprint', clear);
  window.print();
}

export function DownloadBriefButton({
  variant = 'secondary',
  size = 'sm',
  className = '',
}: {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <button type="button" onClick={printBrief} className={btn(variant, size, className)}>
      ↓ Download PDF
    </button>
  );
}

/** Collapses admin-only tools into one menu so composers never see the clutter. */
export function AdminMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const el = ref.current;
      if (!el?.open) return;
      const target = event.target as Node;
      // Modals render inside the menu but outside its box; only close for true outside clicks.
      if (el.contains(target) || (target instanceof Element && target.closest('[role="dialog"], .fixed'))) return;
      el.open = false;
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  return (
    <details ref={ref} className="relative no-print">
      <summary className={btn('secondary', 'sm', 'list-none cursor-pointer [&::-webkit-details-marker]:hidden')}>
        Admin <span aria-hidden="true">▾</span>
      </summary>
      <div className="absolute right-0 mt-2 z-40 w-60 p-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[2px] shadow-2xl flex flex-col gap-1.5 [&_button]:w-full [&_button]:justify-start [&_button]:text-left">
        {children}
      </div>
    </details>
  );
}
