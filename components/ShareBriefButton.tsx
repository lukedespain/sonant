'use client';

import { useState } from 'react';
import Link from 'next/link';
import { btn, fieldLabel, textareaClass } from '@/components/ui';
import Modal, { ModalDone } from '@/components/Modal';
import { IconCheck } from '@/components/shell/icons';

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
        const path = `/briefs/${briefId}`;
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
      <button type="button" onClick={handleOpen} className={btn('secondary', 'sm')}>
        Share
      </button>

      {open && (
        <Modal
          title={done ? undefined : 'Share this brief'}
          subtitle={briefName}
          onClose={handleClose}
          locked={sending}
          footer={
            done ? undefined : !loggedIn ? (
              <>
                <Link href={`/login?redirect=/briefs/${briefId}`} className={btn('primary', 'lg', 'flex-1')}>
                  Sign in
                </Link>
                <button type="button" onClick={handleClose} className={btn('secondary', 'lg')}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  form="share-brief-form"
                  disabled={sending || !emails.trim()}
                  className={btn('primary', 'lg', 'flex-1')}
                >
                  {sending ? 'Sending…' : 'Send invites'}
                </button>
                <button type="button" onClick={handleClose} disabled={sending} className={btn('secondary', 'lg')}>
                  Cancel
                </button>
              </>
            )
          }
        >
          {done ? (
            <ModalDone
              icon={<IconCheck size={20} strokeWidth={2} />}
              title={sentCount === 1 ? 'Invite sent' : 'Invites sent'}
              body={`${sentCount === 1 ? 'They get' : 'They each get'} a link to this brief.`}
              actions={
                <button type="button" onClick={() => setOpen(false)} className={btn('primary', 'md')}>
                  Done
                </button>
              }
            />
          ) : !loggedIn ? (
            <p className="px-6 py-6 text-[14px] text-[var(--text-muted)] leading-relaxed">
              Sign in to send this brief to other composers.
            </p>
          ) : (
            <form id="share-brief-form" onSubmit={handleSend} className="px-6 py-6 flex flex-col gap-5">
              {codeLoading && !code && <p className="text-[13px] text-[var(--text-dim)]">Loading your invite code…</p>}

              {code && shareUrl && (
                <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
                  <p className="text-[13px] text-[var(--text-muted)]">Your invite code</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-[20px] font-semibold tracking-[0.08em] tabular-nums">{code}</p>
                    <button type="button" onClick={() => copy('code', code)} className={btn('secondary', 'sm')}>
                      {copied === 'code' ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy('link', shareUrl)}
                    className="mt-2 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {copied === 'link' ? 'Link copied' : 'Or copy your unique link'}
                  </button>
                </div>
              )}

              <div>
                <label htmlFor="share-emails" className={fieldLabel}>
                  Send to
                </label>
                <textarea
                  id="share-emails"
                  required
                  rows={3}
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="composer@email.com, another@email.com"
                  className={textareaClass}
                />
                <p className="mt-1.5 text-[12px] text-[var(--text-dim)] leading-relaxed">
                  One or many emails, separated by commas.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-[var(--danger)]">
                  {error}
                </p>
              )}
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
