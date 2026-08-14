'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ShareBriefButton({
  briefId,
  briefName,
  loggedIn,
}: {
  briefId: string;
  briefName: string;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setOpen(true);
    setEmail('');
    setError(null);
    setDone(false);
  }

  function handleClose() {
    if (sending) return;
    setOpen(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/briefs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, email: email.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Could not send the invite.');
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        ↗ Share Brief
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(10, 9, 8, 0.85)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-card)] p-8"
            style={{ borderRadius: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4">
                <div className="text-3xl text-[#E85D2F] mb-4">◆</div>
                <h2 className="text-2xl mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
                  Invite sent.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  We emailed them a link to this brief, with a way to join Sonant or sign in. If they create an account, you get a submission credit.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs tracking-[0.2em] uppercase px-6 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                >
                  ◆ Done
                </button>
              </div>
            ) : !loggedIn ? (
              <>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ◆ Share Brief
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Sign in to send this brief to someone. They will get an invite to join Sonant or log in to view it.
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/login?redirect=/browse/${briefId}`}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Sign In
                  </Link>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSend}>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ◆ Share Brief
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Brief
                    </label>
                    <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {briefName}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="share-email"
                      className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Send to
                    </label>
                    <input
                      id="share-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="composer@email.com"
                      className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                    />
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      They get an invite to this brief. If they create an account, you get a submission credit.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-[10px] text-[#FF8B6B] mt-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    × {error}
                  </p>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {sending ? '◆ Sending…' : '◆ Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={sending}
                    className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
