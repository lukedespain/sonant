'use client';

import { useEffect, useRef, useState } from 'react';
import { fieldLabel, inputClass } from '@/components/ui';
import { IconCheck } from '@/components/shell/icons';

/** Text field with a styled suggestion list. Typing anything else is fine too. */
export default function ComboField({
  id,
  label,
  hint,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const list = typed && q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function pick(option: string) {
    onChange(option);
    setOpen(false);
    setTyped(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setTyped(true);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, list.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && open && list[active]) {
              e.preventDefault();
              pick(list[active]);
            } else if (e.key === 'Escape' || e.key === 'Tab') {
              setOpen(false);
            }
          }}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close list' : 'Show options'}
          onClick={() => {
            setTyped(false);
            setOpen((o) => !o);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-primary)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && list.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-64 overflow-y-auto app-scroll p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl animate-rise"
        >
          {list.map((option, i) => {
            const selected = option.toLowerCase() === value.trim().toLowerCase();
            return (
              <li
                key={option}
                role="option"
                aria-selected={selected}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center justify-between gap-3 h-9 px-3 rounded-lg text-[14px] cursor-pointer ${
                  i === active ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {option}
                {selected && <IconCheck size={13} className="text-[var(--signal)]" />}
              </li>
            );
          })}
        </ul>
      )}
      {hint && <p className="mt-1.5 text-[12px] text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}
