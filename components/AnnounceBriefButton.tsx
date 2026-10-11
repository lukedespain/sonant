'use client';

import { useState } from 'react';
import { btn } from '@/components/ui';

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
        className={btn('secondary', 'sm')}
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
