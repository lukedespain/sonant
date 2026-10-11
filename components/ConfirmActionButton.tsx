'use client';

import { useState, useTransition } from 'react';

export default function ConfirmActionButton({
  label,
  confirmLabel,
  pendingLabel,
  danger = false,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  pendingLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<string | null>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const accent = danger
    ? 'border-[#C5564A] text-[#C5564A]'
    : 'border-[#E85D2F] text-[#E85D2F]';
  const rest = danger
    ? 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#C5564A] hover:text-[#C5564A]'
    : 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]';

  function run() {
    setError(null);
    startTransition(async () => {
      const message = await onConfirm();
      setConfirming(false);
      if (message) setError(message);
    });
  }

  return (
    <div className="relative">
      {confirming || pending ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className={`inline-flex items-center h-9 px-4 font-mono text-[10px] tracking-[0.14em] uppercase rounded-[2px] border ${accent} disabled:opacity-60 disabled:cursor-wait transition-colors`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
          {!pending && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-1"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className={`inline-flex items-center h-9 px-4 font-mono text-[10px] tracking-[0.14em] uppercase rounded-[2px] border ${rest} transition-colors`}
        >
          {label}
        </button>
      )}
      {error && (
        <p
          role="alert"
          className="absolute right-0 top-full mt-2 w-72 z-10 p-3 text-xs leading-relaxed text-[#FF8B6B] bg-[var(--bg-card)] border border-[#4A3633]"
          style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
