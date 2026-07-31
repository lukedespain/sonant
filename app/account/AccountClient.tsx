'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  submissions: number;
  featured: number;
  uploads: number;
  generations: number;
}

interface Props {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  email: string;
  isPro: boolean;
  memberSince: string;
  submissionCredits: number;
  sessionCredits: number;
  stats: Stats;
  signOutAction: () => Promise<void>;
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#E85D2F', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009473', '#DD4132', '#45B5AA',
];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function CreditDot({ filled }: { filled: boolean }) {
  return (
    <div
      className={`w-8 h-8 flex items-center justify-center text-base transition-colors ${
        filled ? 'text-[#E85D2F]' : 'text-[var(--border-subtle)]'
      }`}
      style={{ fontFamily: "'Fraunces', serif" }}
    >
      ◆
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5" style={{ borderRadius: '2px' }}>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div className="text-4xl text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
        {value}
      </div>
    </div>
  );
}

export default function AccountClient({
  userId, initialName, initialAvatarUrl, email, isPro,
  memberSince, submissionCredits, sessionCredits, stats, signOutAction,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  async function startCheckout(type: 'pro' | 'submission' | 'session') {
    setCheckoutLoading(type);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    setCheckoutLoading(null);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  }

  async function handleNameSave() {
    if (!nameInput.trim() || nameInput.trim() === name) {
      setNameEditing(false);
      setNameInput(name);
      return;
    }
    setNameSaving(true);
    setNameError(null);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nameInput.trim() }),
    });
    setNameSaving(false);
    if (res.ok) {
      setName(nameInput.trim());
      setNameEditing(false);
      router.refresh();
    } else {
      const j = await res.json();
      setNameError(j.error ?? 'Failed to save');
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAvatarUploading(true);
    setAvatarError(null);
    const body = new FormData();
    body.set('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body });
    setAvatarUploading(false);
    if (res.ok) {
      const { avatar_url } = await res.json();
      setAvatarUrl(avatar_url);
      router.refresh();
    } else {
      const j = await res.json();
      setAvatarError(j.error ?? 'Upload failed');
    }
  }

  const color = avatarColor(userId);

  return (
    <div className="space-y-10">

      {/* Profile header */}
      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-semibold focus:outline-none"
            style={{ background: avatarUrl ? undefined : color, fontFamily: "'DM Sans', sans-serif" }}
            title="Upload photo"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              : getInitials(name)
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[9px] tracking-[0.2em] uppercase text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {avatarUploading ? '…' : 'Edit'}
              </span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="flex-1 pt-1">
          {nameEditing ? (
            <div className="flex items-center gap-3 mb-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') { setNameEditing(false); setNameInput(name); }
                }}
                autoFocus
                className="text-2xl bg-transparent border-b border-[#E85D2F] focus:outline-none text-[var(--text-primary)] w-full max-w-xs"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              />
              <button onClick={handleNameSave} disabled={nameSaving}
                className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {nameSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setNameEditing(false); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:opacity-70 transition-opacity"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
                {name}
              </span>
              <button onClick={() => { setNameEditing(true); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Edit
              </button>
            </div>
          )}
          {nameError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {nameError}</p>}
          {avatarError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {avatarError}</p>}
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[9px] tracking-[0.25em] uppercase px-2 py-1 ${isPro ? 'bg-[#E85D2F] text-[var(--bg-base)]' : 'border border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              {isPro ? '◆ Pro' : 'Free'}
            </span>
            <span className="text-[10px] text-[var(--text-dimmer)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Member since {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Your Credits
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Submission credits */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5" style={{ borderRadius: '2px' }}>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Submission Credits
            </div>
            <div className="flex gap-1 mb-3">
              {Array.from({ length: Math.max(submissionCredits, isPro ? 3 : 1) }).map((_, i) => (
                <CreditDot key={i} filled={i < submissionCredits} />
              ))}
            </div>
            <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {submissionCredits === 0
                ? 'No submission credits remaining.'
                : `${submissionCredits} submission${submissionCredits === 1 ? '' : 's'} available.`}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Link
                href="/browse"
                className="text-[9px] tracking-[0.2em] uppercase px-3 py-2 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                Browse Briefs
              </Link>
              <button
                onClick={() => startCheckout('submission')}
                disabled={checkoutLoading === 'submission'}
                className="text-[9px] tracking-[0.2em] uppercase px-3 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                {checkoutLoading === 'submission' ? '…' : `+ Buy Credit — $${isPro ? '5' : '10'}`}
              </button>
            </div>
          </div>

          {/* Feedback session credits */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5" style={{ borderRadius: '2px' }}>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Feedback Sessions
            </div>
            <div className="flex gap-1 mb-3">
              {sessionCredits > 0
                ? Array.from({ length: sessionCredits }).map((_, i) => <CreditDot key={i} filled />)
                : <CreditDot filled={false} />
              }
            </div>
            <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {sessionCredits === 0
                ? 'No sessions available.'
                : `${sessionCredits} session${sessionCredits === 1 ? '' : 's'} available. 45 min with Luke.`}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {sessionCredits > 0 ? (
                <a
                  href="https://cal.com/lukedespain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] tracking-[0.2em] uppercase px-3 py-2 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Book Session
                </a>
              ) : (
                <button
                  disabled
                  className="text-[9px] tracking-[0.2em] uppercase px-3 py-2 bg-[#E85D2F]/40 text-[var(--bg-base)] cursor-not-allowed"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Book Session
                </button>
              )}
              <button
                onClick={() => startCheckout('session')}
                disabled={checkoutLoading === 'session'}
                className="text-[9px] tracking-[0.2em] uppercase px-3 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                {checkoutLoading === 'session' ? '…' : `+ Buy Session — $${isPro ? '25' : '50'}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA — free users only */}
      {!isPro && (
        <div className="border border-[#E85D2F]/30 bg-[#E85D2F]/5 p-6" style={{ borderRadius: '2px' }}>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Go Pro
          </div>

          {/* Free vs Pro comparison */}
          <div className="border border-[var(--border-base)] mb-5 overflow-hidden" style={{ borderRadius: '2px' }}>
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr]">
              <div className="px-4 py-3 bg-[var(--bg-card)]" />
              <div className="px-4 py-3 bg-[var(--bg-card)] border-l border-[var(--border-base)]">
                <span className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Free</span>
              </div>
              <div className="px-4 py-3 bg-[#E85D2F]/10 border-l border-[var(--border-base)]">
                <span className="text-[9px] tracking-[0.25em] uppercase text-[#E85D2F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>◆ Pro</span>
              </div>
            </div>
            {/* Submissions */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[var(--border-base)]">
              <div className="px-4 py-4 bg-[var(--bg-card)]">
                <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Submissions</span>
              </div>
              <div className="px-4 py-4 bg-[var(--bg-card)] border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>1 credit/mo</div>
                <div className="text-xs text-[var(--text-dimmer)] mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>carries over</div>
              </div>
              <div className="px-4 py-4 bg-[#E85D2F]/5 border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>3 credits/mo</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>carries over</div>
              </div>
            </div>
            {/* Feedback calls */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[var(--border-base)]">
              <div className="px-4 py-4 bg-[var(--bg-card)]">
                <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Feedback calls</span>
              </div>
              <div className="px-4 py-4 bg-[var(--bg-card)] border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-dimmer)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>—</div>
              </div>
              <div className="px-4 py-4 bg-[#E85D2F]/5 border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>✓ 45-min welcome call</div>
              </div>
            </div>
            {/* Extra credit */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[var(--border-base)]">
              <div className="px-4 py-4 bg-[var(--bg-card)]">
                <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Extra credit</span>
              </div>
              <div className="px-4 py-4 bg-[var(--bg-card)] border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>$10</div>
              </div>
              <div className="px-4 py-4 bg-[#E85D2F]/5 border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  $5 <span className="text-xs text-[var(--text-muted)]">· 50% off</span>
                </div>
              </div>
            </div>
            {/* Extra session */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[var(--border-base)]">
              <div className="px-4 py-4 bg-[var(--bg-card)]">
                <span className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Extra session</span>
              </div>
              <div className="px-4 py-4 bg-[var(--bg-card)] border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>$50</div>
              </div>
              <div className="px-4 py-4 bg-[#E85D2F]/5 border-l border-[var(--border-base)]">
                <div className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  $25 <span className="text-xs text-[var(--text-muted)]">· 50% off</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => startCheckout('pro')}
            disabled={checkoutLoading === 'pro'}
            className="text-[9px] tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            {checkoutLoading === 'pro' ? '◆ Redirecting…' : '◆ Upgrade to Pro — $12/mo'}
          </button>
        </div>
      )}

      {/* Activity stats */}
      <div>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Your Activity
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Submissions" value={stats.submissions} />
          <StatCard label="Featured" value={stats.featured} />
          <StatCard label="Uploads" value={stats.uploads} />
          <StatCard label="Generations" value={stats.generations} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Link
          href="/browse"
          className="px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
        >
          ◆ Browse Briefs
        </Link>
        <Link
          href="/generator"
          className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
        >
          Generator
        </Link>
        <Link
          href="/library"
          className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
        >
          My Submissions
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Sign Out
          </button>
        </form>
      </div>

    </div>
  );
}
