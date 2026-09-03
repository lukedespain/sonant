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
  const [emails, setEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  async function loadCode() {
    setCodeLoading(true);
    try {
      const res = await fetch('/api/briefs/share');
      if (!res.ok) return;
      const json = await res.json();
      const nextCode = typeof json.code === 'string' ? json.code : null;
      setCode(nextCode);
      if (nextCode) {
        const path = `/browse/${briefId}`;
        setShareUrl(`${json.shareBase}&redirect=${encodeURIComponent(path)}`);
      }
    } finally {
      setCodeLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setEmails('');
    setError(null);
    setDone(false);
    setCopied(null);
    if (loggedIn) void loadCode();
  }

  function handleClose() {
    if (sending) return;
    setOpen(false);
  }

  async function copy(kind: 'link' | 'code', value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setError('Could not copy. Select the text instead.');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!emails.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/briefs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, emails: emails.split(/[,;\n]+/) }),
    });
    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Could not send the invite.');
      return;
    }
    const json = await res.json();
    setSentCount(typeof json.sent === 'number' ? json.sent : 1);
    if (typeof json.code === 'string') setCode(json.code);
    if (typeof json.shareUrl === 'string') setShareUrl(json.shareUrl);
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
                  Invite{sentCount === 1 ? '' : 's'} sent.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {sentCount === 1 ? 'They get' : 'They each get'} a link to this brief. If they create an account from your code, you earn a submission credit.
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
                  Sign in to send this brief and earn a submission credit when someone joins from your invite.
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

                  {codeLoading && !code && (
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Loading your invite code…
                    </p>
                  )}

                  {code && shareUrl && (
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Your invite code
                      </div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-lg tracking-[0.12em] text-[var(--text-primary)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {code}
                        </p>
                        <button
                          type="button"
                          onClick={() => copy('code', code)}
                          className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {copied === 'code' ? 'Copied' : 'Copy code'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy('link', shareUrl)}
                        className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {copied === 'link' ? 'Link copied' : 'Copy unique link'}
                      </button>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="share-emails"
                      className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Send to
                    </label>
                    <textarea
                      id="share-emails"
                      required
                      rows={3}
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      placeholder="composer@email.com, another@email.com"
                      className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                    />
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      One or many emails. Each new signup from your code earns you a submission credit.
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
                    disabled={sending || !emails.trim()}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {sending ? '◆ Sending…' : '◆ Send Invites'}
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
