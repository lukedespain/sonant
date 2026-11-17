'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { btn } from '@/components/ui';
import { IconDownload } from '@/components/shell/icons';

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

/** Downloads the server-rendered PDF. Briefs that are not saved yet fall back to printing. */
export function DownloadBriefButton({
  briefId,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: {
  briefId?: string | null;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');

  async function download() {
    if (!briefId) {
      printBrief();
      return;
    }
    setState('working');
    try {
      const res = await fetch(`/api/briefs/${briefId}/pdf`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const name =
        /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'Thought Collective brief.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <button type="button" onClick={download} disabled={state === 'working'} className={btn(variant, size, className)}>
      {state === 'working' ? (
        'Preparing PDF…'
      ) : state === 'error' ? (
        'Try again'
      ) : (
        <>
          <IconDownload size={14} /> Download PDF
        </>
      )}
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
        Admin tools <span aria-hidden="true" className="text-[var(--text-dim)]">▾</span>
      </summary>
      <div className="absolute right-0 mt-2 z-40 w-64 p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col gap-1 animate-rise [&_button]:w-full [&_button]:justify-start [&_button]:text-left">
        {children}
      </div>
    </details>
  );
}
