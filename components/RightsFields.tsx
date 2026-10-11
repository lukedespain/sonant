'use client';

import { useId } from 'react';
import { PRO_OPTIONS, type RightsInfo } from '@/lib/handoff';

const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

const inputClass =
  'w-full px-3 py-2.5 bg-[var(--bg-base)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none';

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  list,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  list?: string;
  inputMode?: 'numeric' | 'text';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-2" style={mono}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        list={list}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        style={{ ...sans, borderRadius: '2px' }}
      />
      {hint && (
        <p className="mt-1.5 text-[11px] text-[var(--text-dimmer)]" style={sans}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function RightsFields({
  value,
  onChange,
}: {
  value: RightsInfo;
  onChange: (next: RightsInfo) => void;
}) {
  const base = useId();
  const set = (key: keyof RightsInfo) => (v: string) => onChange({ ...value, [key]: v });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
      <Field id={`${base}-legal`} label="Legal name" value={value.legalName} onChange={set('legalName')} autoComplete="name" hint="As it appears with your PRO." />
      <Field id={`${base}-pro`} label="PRO" value={value.pro} onChange={set('pro')} list={`${base}-pros`} hint="ASCAP, BMI, PRS, or yours." />
      <datalist id={`${base}-pros`}>
        {PRO_OPTIONS.map((pro) => (
          <option key={pro} value={pro} />
        ))}
      </datalist>
      <Field id={`${base}-ipi`} label="Composer IPI" value={value.composerIpi} onChange={set('composerIpi')} inputMode="numeric" hint="9 to 11 digits. Find it in your PRO account." />
      <div className="hidden sm:block" />
      <Field id={`${base}-pub`} label="Publisher name" value={value.publisherName} onChange={set('publisherName')} hint="Leave blank if you are not with a publisher." />
      <Field id={`${base}-pubipi`} label="Publisher IPI" value={value.publisherIpi} onChange={set('publisherIpi')} inputMode="numeric" />
    </div>
  );
}
