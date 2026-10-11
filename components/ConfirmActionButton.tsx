'use client';

import { useState, useTransition } from 'react';

const mono = { fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' } as const;

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
    ? 'border-[#4A3633] text-[#9A8A86] hover:border-[#C5564A] hover:text-[#C5564A]'
    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F]';

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
            className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border ${accent} disabled:opacity-60 disabled:cursor-wait transition-colors`}
            style={mono}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
          {!pending && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-1"
              style={mono}
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
          className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border ${rest} transition-colors`}
          style={mono}
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
