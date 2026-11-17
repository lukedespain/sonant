'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn, inputClass } from '@/components/ui';
import type { ComposerMatch } from '@/lib/projects';

export default function InvitePanel({
  projectId,
  matches,
  invited,
}: {
  projectId: string;
  matches: ComposerMatch[];
  invited: string[];
}) {
  const router = useRouter();
  const invitedSet = useMemo(() => new Set(invited), [invited]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const visible = matches.filter((m) => {
    const q = query.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
  });

  async function save(add: string[], remove: string[] = []) {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/projects/${projectId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ add, remove }),
    });
    const j = (await res.json().catch(() => ({}))) as { added?: number; error?: string };
    setSaving(false);
    if (!res.ok) {
      setMessage(j.error ?? 'Could not save.');
      return;
    }
    setPicked(new Set());
    setMessage(add.length ? `Invited ${j.added ?? add.length}. They get an email now.` : 'Removed.');
    router.refresh();
  }

  function toggle(id: string) {
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, or tag" className={`${inputClass} sm:max-w-xs`} />
        <div className="flex items-center gap-3">
          {message && <span className="text-[13px] text-[var(--text-muted)]">{message}</span>}
          <button type="button" disabled={picked.size === 0 || saving} onClick={() => save([...picked])} className={btn('accent', 'md')}>
            {saving ? 'Saving…' : `Invite ${picked.size || ''}`.trim()}
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-5 py-10 text-center text-[14px] text-[var(--text-dim)]">
          Nobody is on the roster yet. Composers join when a catalogue track is accepted.
        </p>
      ) : (
        <ul className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
          {visible.map((m) => {
            const isIn = invitedSet.has(m.id);
            return (
              <li key={m.id} className="row-hover px-4 py-3 flex items-center gap-4">
                {isIn ? (
                  <span className="w-4 h-4 shrink-0 rounded-full bg-[var(--positive)]" aria-hidden="true" />
                ) : (
                  <input
                    type="checkbox"
                    checked={picked.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="w-4 h-4 shrink-0 accent-[var(--signal)]"
                    aria-label={`Invite ${m.name}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium truncate">
                    {m.name}
                    <span className="ml-2 text-[12px] font-normal text-[var(--text-dim)]">
                      {m.placements} {m.placements === 1 ? 'placement' : 'placements'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--text-dim)] truncate">
                    {m.matched.length > 0 ? (
                      <>
                        <span className="text-[var(--signal)]">Fits {m.matched.join(', ')}</span>
                        {m.tags.length > m.matched.length && ` · also ${m.tags.filter((t) => !m.matched.includes(t)).slice(0, 4).join(', ')}`}
                      </>
                    ) : (
                      m.tags.slice(0, 6).join(', ') || 'No tags yet'
                    )}
                  </p>
                </div>
                {isIn && (
                  <button type="button" disabled={saving} onClick={() => save([], [m.id])} className={btn('ghost', 'sm')}>
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
