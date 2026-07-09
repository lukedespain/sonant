'use client';

import { useState } from 'react';
import { setDiscoPlaylistId } from '@/app/briefs/actions';

export default function DiscoAdminInput({
  briefId,
  currentId,
}: {
  briefId: string;
  currentId: string | null;
}) {
  const [value, setValue] = useState(currentId ?? '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    setErrorMsg(null);
    const result = await setDiscoPlaylistId(briefId, value);
    setSaving(false);
    if (result.error) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('saved');
    }
  }

  return (
    <div className="mt-6 pt-5 border-t border-[var(--border-card)]">
      <div
        className="text-[9px] tracking-[0.3em] uppercase text-[#E85D2F] mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ◆ Admin — Disco Playlist ID
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus('idle'); }}
          placeholder="e.g. 30523107"
          className="flex-1 px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[#E85D2F] focus:outline-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[10px] tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
      {status === 'saved' && (
        <p className="text-[10px] text-[#7A9A6E] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ✓ Saved
        </p>
      )}
      {status === 'error' && (
        <p className="text-[10px] text-[#FF8B6B] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          × {errorMsg ?? 'Could not save'}
        </p>
      )}
    </div>
  );
}
