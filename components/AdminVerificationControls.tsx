'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VerifiedOverride } from '@/lib/verification';

export default function AdminVerificationControls({
  userId,
  override,
  accepted,
  onChanged,
}: {
  userId: string;
  override: VerifiedOverride;
  accepted: number;
  onChanged?: (override: VerifiedOverride) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setOverride(next: VerifiedOverride) {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, override: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Could not update the badge.');
      return;
    }
    onChanged?.(next);
    router.refresh();
  }

  const active =
    override === true ? 'grant' : override === false ? 'revoke' : 'auto';

  const btn = (id: 'auto' | 'grant' | 'revoke', label: string) => (
    <button
      type="button"
      onClick={() => setOverride(id === 'auto' ? null : id === 'grant')}
      disabled={saving || active === id}
      className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-colors ${
        active === id
          ? 'border-[#E85D2F] text-[#E85D2F]'
          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F]'
      } disabled:opacity-50`}
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-6 pt-5 border-t border-[var(--border-card)]">
      <div
        className="text-[9px] tracking-[0.3em] uppercase text-[#E85D2F] mb-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ◆ Admin · Verified badge
      </div>
      <p
        className="text-xs text-[var(--text-muted)] leading-relaxed mb-3"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Automatic rule: {accepted} accepted catalog placement{accepted === 1 ? '' : 's'}.
      </p>
      <div className="flex flex-wrap gap-2">
        {btn('auto', 'Automatic')}
        {btn('grant', 'Grant')}
        {btn('revoke', 'Revoke')}
      </div>
      {error && (
        <p className="text-[10px] text-[#FF8B6B] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          × {error}
        </p>
      )}
    </div>
  );
}
