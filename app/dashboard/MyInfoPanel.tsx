'use client';

import { useState } from 'react';
import RightsFields from '@/components/RightsFields';
import type { RightsInfo } from '@/lib/handoff';

const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function MyInfoPanel({
  rights: initial,
  onSaved,
}: {
  rights: RightsInfo;
  onSaved: (rights: RightsInfo) => void;
}) {
  const [rights, setRights] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/profile/rights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rights),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; rights?: RightsInfo };
    setSaving(false);
    if (!res.ok || !json.rights) {
      setError(json.error ?? 'Could not save your info.');
      return;
    }
    setRights(json.rights);
    onSaved(json.rights);
    setMessage('Saved.');
  }

  return (
    <form onSubmit={save} className="max-w-2xl">
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-xl" style={sans}>
        When a catalog takes one of your tracks, they need this to register it and pay you. Fill it in once and it is ready when you need it. Only the Sonant team sees it.
      </p>
      <RightsFields value={rights} onChange={setRights} />
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] disabled:opacity-50 disabled:cursor-wait transition-colors"
          style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
        >
          {saving ? 'Saving…' : '◆ Save my info'}
        </button>
        {message && <span className="text-[11px] text-[#7A9A6E]" style={sans}>{message}</span>}
        {error && <span role="alert" className="text-[11px] text-[#FF8B6B]" style={sans}>{error}</span>}
      </div>
    </form>
  );
}
