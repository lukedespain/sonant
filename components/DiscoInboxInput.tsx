'use client';

import { useState } from 'react';
import { setDiscoInboxUrl } from '@/app/briefs/actions';

export default function DiscoInboxInput({
  briefId,
  currentUrl,
}: {
  briefId: string;
  currentUrl: string | null;
}) {
  const [value, setValue] = useState(currentUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    setErrorMsg(null);
    const result = await setDiscoInboxUrl(briefId, value);
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
        className="text-[12px] text-[var(--accent)] mb-3"
        style={{ fontFamily: "var(--brand-mono)" }}
      >
        Admin · Disco inbox
      </div>
      <p
        className="text-xs text-[var(--text-muted)] leading-relaxed mb-3"
        style={{ fontFamily: "var(--brand-sans)" }}
      >
        Verified composers are sent here. Leave blank to use the default inbox.
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus('idle');
          }}
          placeholder="https://s.disco.ac/…"
          className="flex-1 px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[var(--signal-line)] focus:outline-none"
          style={{ fontFamily: "var(--brand-mono)" }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-[14px] font-medium bg-[var(--accent)] text-[#0A0A0A] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--brand-mono)" }}
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
      {status === 'saved' && (
        <p className="text-[12px] text-[#7A9A6E] mt-2" style={{ fontFamily: "var(--brand-mono)" }}>
          ✓ Saved
        </p>
      )}
      {status === 'error' && (
        <p className="text-[12px] text-[var(--danger)] mt-2" style={{ fontFamily: "var(--brand-mono)" }}>
          × {errorMsg ?? 'Could not save'}
        </p>
      )}
    </div>
  );
}
