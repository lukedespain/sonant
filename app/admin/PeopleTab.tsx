'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminVerificationControls from '@/components/AdminVerificationControls';
import { VERIFICATION_THRESHOLD, type VerifiedOverride } from '@/lib/verification';
import type { AdminPerson } from '@/lib/admin-people';

const AVATAR_COLORS = [
  '#E85D2F', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009473', '#DD4132', '#45B5AA',
];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function PeopleTab() {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<AdminPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = people.find((person) => person.id === selectedId) ?? null;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const q = query.trim();
      const params = q.length >= 2 ? `?q=${encodeURIComponent(q)}` : '';
      setLoading(true);
      setError(null);
      fetch(`/api/admin/people${params}`)
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Search failed.');
          return json as { people: AdminPerson[] };
        })
        .then((json) => {
          setPeople(json.people);
          setSelectedId((current) => {
            if (current && json.people.some((person) => person.id === current)) return current;
            return json.people[0]?.id ?? null;
          });
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  function patchSelected(partial: Partial<AdminPerson>) {
    if (!selectedId) return;
    setPeople((list) =>
      list.map((person) => (person.id === selectedId ? { ...person, ...partial } : person))
    );
  }

  async function changeCredits(kind: 'submission' | 'session', delta: 1 | -1) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/people/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selected.id,
        submissionDelta: kind === 'submission' ? delta : 0,
        sessionDelta: kind === 'session' ? delta : 0,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Could not update credits.');
      return;
    }
    patchSelected({
      submissionCredits: (json as { submissionCredits: number }).submissionCredits,
      sessionCredits: (json as { sessionCredits: number }).sessionCredits,
    });
  }

  async function changePlacement(delta: 1 | -1) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/people/placement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected.id, delta }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Could not update placements.');
      return;
    }
    const manualPlacements = (json as { manualPlacements: number }).manualPlacements;
    const accepted = selected.acceptedOnBriefs + manualPlacements;
    patchSelected({
      manualPlacements,
      accepted,
      verified:
        selected.override === true ||
        (selected.override !== false && accepted >= VERIFICATION_THRESHOLD),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] gap-8 items-start">
      <div>
        <label
          htmlFor="people-search"
          className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
          style={mono}
        >
          Search composers
        </label>
        <input
          id="people-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or email"
          className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none mb-4"
          style={{ ...sans, borderRadius: '2px' }}
        />
        <div className="border border-[var(--border-card)] bg-[var(--bg-card)]" style={{ borderRadius: '2px' }}>
          {loading && people.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--text-muted)]" style={sans}>
              Looking up composers…
            </p>
          ) : people.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--text-muted)]" style={sans}>
              No one matches that search.
            </p>
          ) : (
            <ul>
              {people.map((person) => {
                const active = person.id === selectedId;
                return (
                  <li key={person.id} className="border-b border-[var(--border-base)] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(person.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        active ? 'bg-[var(--bg-base)]' : 'hover:bg-[var(--bg-base)]/50'
                      }`}
                    >
                      <div className="text-sm text-[var(--text-primary)] truncate" style={sans}>
                        {person.name}
                      </div>
                      <div
                        className="text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] truncate mt-0.5"
                        style={mono}
                      >
                        {person.email || 'No email'}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        {selected ? (
          <PersonCard
            person={selected}
            saving={saving}
            error={error}
            onCredit={changeCredits}
            onPlacement={changePlacement}
            onOverride={(override) => {
              patchSelected({
                override,
                verified:
                  override === true ||
                  (override !== false && selected.accepted >= VERIFICATION_THRESHOLD),
              });
            }}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]" style={sans}>
            Search for a composer to view their profile and credits.
          </p>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  saving,
  error,
  onCredit,
  onPlacement,
  onOverride,
}: {
  person: AdminPerson;
  saving: boolean;
  error: string | null;
  onCredit: (kind: 'submission' | 'session', delta: 1 | -1) => void;
  onPlacement: (delta: 1 | -1) => void;
  onOverride: (override: VerifiedOverride) => void;
}) {
  return (
    <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-6" style={{ borderRadius: '2px' }}>
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white text-sm shrink-0"
          style={{
            background: person.avatarUrl ? undefined : avatarColor(person.id),
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          {person.avatarUrl ? (
            <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(person.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl tracking-tight text-[var(--text-primary)]" style={{ ...serif, fontWeight: 300 }}>
            {person.name}
          </h2>
          <div className="text-[10px] tracking-[0.16em] uppercase text-[var(--text-muted)] mt-1" style={mono}>
            {person.email || 'No email on file'}
            {person.verified ? ' · Verified composer' : ''}
          </div>
          <Link
            href={`/profile/${person.id}`}
            className="inline-block mt-3 text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
            style={mono}
          >
            View profile →
          </Link>
        </div>
      </div>

      <CreditRow
        label="Submission credits"
        value={person.submissionCredits}
        disabled={saving}
        canRemove={person.submissionCredits > 0}
        onChange={(delta) => onCredit('submission', delta)}
      />
      <CreditRow
        label="Session credits"
        value={person.sessionCredits}
        disabled={saving}
        canRemove={person.sessionCredits > 0}
        onChange={(delta) => onCredit('session', delta)}
      />
      <CreditRow
        label="Catalog placements"
        value={`${person.accepted} / ${VERIFICATION_THRESHOLD}`}
        hint={
          person.manualPlacements > 0
            ? `${person.acceptedOnBriefs} accepted on briefs · ${person.manualPlacements} added by hand`
            : person.acceptedOnBriefs > 0
              ? `${person.acceptedOnBriefs} accepted on briefs`
              : 'Nothing counted yet. Add one if a placement happened off-platform.'
        }
        disabled={saving}
        canRemove={person.manualPlacements > 0}
        removeTitle={
          person.manualPlacements === 0
            ? 'Only hand-added placements can be removed here. Un-accept a submission to lower the brief count.'
            : undefined
        }
        onChange={onPlacement}
      />

      {error && (
        <p className="text-[10px] text-[#FF8B6B] mt-4" style={mono}>
          × {error}
        </p>
      )}

      <AdminVerificationControls
        userId={person.id}
        override={person.override}
        accepted={person.accepted}
        onChanged={onOverride}
      />
    </div>
  );
}

function CreditRow({
  label,
  value,
  hint,
  disabled,
  canRemove,
  removeTitle,
  onChange,
}: {
  label: string;
  value: number | string;
  hint?: string;
  disabled: boolean;
  canRemove: boolean;
  removeTitle?: string;
  onChange: (delta: 1 | -1) => void;
}) {
  const step =
    'w-8 h-8 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] disabled:opacity-40 disabled:hover:border-[var(--border-subtle)] disabled:hover:text-[var(--text-muted)] transition-colors';

  return (
    <div className="py-4 border-t border-[var(--border-card)] first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-1" style={mono}>
            {label}
          </div>
          <div className="text-2xl text-[var(--text-primary)] leading-none" style={{ ...serif, fontWeight: 300 }}>
            {value}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(-1)}
            disabled={disabled || !canRemove}
            title={removeTitle}
            className={step}
            style={{ ...mono, borderRadius: '2px' }}
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onChange(1)}
            disabled={disabled}
            className={step}
            style={{ ...mono, borderRadius: '2px' }}
            aria-label={`Add ${label.toLowerCase()}`}
          >
            +
          </button>
        </div>
      </div>
      {hint && (
        <p className="text-xs text-[var(--text-muted)] mt-2" style={sans}>
          {hint}
        </p>
      )}
    </div>
  );
}
