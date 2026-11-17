'use client';

import { useState } from 'react';
import RightsFields from '@/components/RightsFields';
import type { RightsInfo } from '@/lib/handoff';
import { btn } from '@/components/ui';

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
    <form onSubmit={save}>
      <RightsFields value={rights} onChange={setRights} />
      <div className="mt-8 pt-6 border-t border-[var(--border-base)] flex items-center gap-4 flex-wrap">
        <button type="submit" disabled={saving} className={btn('primary', 'md')}>
          {saving ? 'Saving…' : 'Save my info'}
        </button>
        {message && <span className="text-[13px] text-[var(--positive)]">{message}</span>}
        {error && (
          <span role="alert" className="text-[13px] text-[var(--danger)]">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
