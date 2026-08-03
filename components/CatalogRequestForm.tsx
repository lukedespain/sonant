'use client';

import { useState } from 'react';

const ROLES = [
  'Music Supervisor',
  'Music House',
  'Video Game Studio',
  'Filmmaker',
  'Music Library or Sync Agent',
  'Other',
];

export default function CatalogRequestForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/catalog/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, lookingFor }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Something went wrong. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="border border-[#E85D2F]/40 bg-[#E85D2F]/5 p-6" style={{ borderRadius: '2px' }}>
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Request received
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Thanks — we&apos;ll be in touch within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <div>
          <button
            onClick={() => setOpen(true)}
            className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Request Catalog Access
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div>
            <label
              className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Your email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
            />
          </div>

          <div>
            <label
              className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Your role
            </label>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors appearance-none pr-8"
                style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
              >
                <option value="">Select a role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dimmer)] text-xs">▾</span>
            </div>
          </div>

          <div>
            <label
              className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              What are you looking for? <span className="normal-case tracking-normal text-[var(--text-dimmer)]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Genre, mood, project type…"
              className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors resize-none placeholder:text-[var(--text-dimmer)]"
              style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
            />
          </div>

          {error && (
            <p className="text-xs text-[#FF8B6B]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              {submitting ? '◆ Sending…' : '◆ Send Request'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Cancel
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
