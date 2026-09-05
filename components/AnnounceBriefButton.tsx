'use client';

import { useState } from 'react';

export default function AnnounceBriefButton({
  briefId,
  kind,
}: {
  briefId: string;
  kind: 'client' | 'featured';
}) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (sending) return;
    setSending(true);
    setMessage(null);
    const res = await fetch('/api/admin/announce-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId }),
    });
    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? 'Could not send.');
      return;
    }
    const json = await res.json();
    const sent = typeof json.sent === 'number' ? json.sent : 0;
    setMessage(sent === 1 ? 'Sent to 1 composer' : `Sent to ${sent} composers`);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={sending}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        {sending ? '◆ Sending…' : kind === 'client' ? '↗ Email verified' : '↗ Email everyone'}
      </button>
      {message && (
        <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-dimmer)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {message}
        </span>
      )}
    </div>
  );
}
