'use client';

import { useEffect, useRef, useState } from 'react';
import { norm } from '@/lib/sound';

/** A pill button that opens a checklist with counts. Used for brief and roster filters. */
export default function FilterMenu({
  label,
  options,
  value,
  onChange,
  searchable = false,
}: {
  label: string;
  options: { label: string; n: number }[];
  value: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const on = new Set(value.map(norm));
  const shown = q ? options.filter((o) => norm(o.label).includes(norm(q))) : options;

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  if (options.length === 0) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`h-10 px-3.5 rounded-full border text-[13px] flex items-center gap-2 whitespace-nowrap transition-colors ${
          value.length > 0
            ? 'border-[var(--signal-line)] text-[var(--text-primary)] bg-[var(--signal-soft)]'
            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
        }`}
      >
        {label}
        {value.length > 0 && <span className="text-[var(--signal)] font-medium">{value.length}</span>}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 w-64 p-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl animate-rise">
          {searchable && options.length > 8 && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Find a ${label.toLowerCase()}`}
              aria-label={`Find a ${label.toLowerCase()}`}
              className="w-full h-9 mb-1.5 px-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:outline-none focus:border-[var(--signal-line)]"
            />
          )}
          <ul className="max-h-72 overflow-y-auto app-scroll">
            {shown.map((o) => {
              const checked = on.has(norm(o.label));
              return (
                <li key={o.label}>
                  <label className="flex items-center gap-2.5 h-9 px-2.5 rounded-xl text-[13px] cursor-pointer hover:bg-[var(--accent-soft)]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChange(checked ? value.filter((v) => norm(v) !== norm(o.label)) : [...value, o.label])}
                      className="w-4 h-4 accent-[var(--signal)]"
                    />
                    <span className="flex-1 truncate">{o.label}</span>
                    <span className="text-[var(--text-dim)] tabular-nums">{o.n}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full h-8 rounded-xl text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

