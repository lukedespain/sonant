'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUBMISSION_TURNAROUND_DAYS = 2;

interface Stats {
  submissions: number;
  featured: number;
  uploads: number;
  generations: number;
}

interface SubmissionRecord {
  id: string;
  briefId: string;
  codename: string;
  status: string;
  createdAt: string;
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
  submissions: SubmissionRecord[];
  signOutAction: () => Promise<void>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received:       { label: 'Received',       color: 'text-[var(--text-muted)]' },
  in_review:      { label: 'In review',      color: 'text-[#E8B82F]' },
  feedback_ready: { label: 'Feedback ready', color: 'text-[#88B04B]' },
  accepted:       { label: 'Accepted',       color: 'text-[#88B04B]' },
  not_accepted:   { label: 'Not selected',   color: 'text-[var(--text-muted)]' },
};

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

export default function AccountClient({
  userId, initialName, initialAvatarUrl, email, isPro,
  memberSince, submissionCredits, sessionCredits, stats, submissions, signOutAction,
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
  const hasActivity = stats.generations > 0 || stats.uploads > 0 || stats.featured > 0;

  return (
    <div className="space-y-12">

      {/* ── Page header ── */}
      <div>
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Dashboard
        </div>
        <h1
          className="text-5xl md:text-6xl tracking-tight leading-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Your <span className="italic">dashboard.</span>
        </h1>
      </div>

      {/* ── Profile ── */}
      <div className="flex items-start gap-5">
        <div className="shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-semibold focus:outline-none"
            style={{ background: avatarUrl ? undefined : color, fontFamily: "'DM Sans', sans-serif" }}
            title="Upload photo"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              : getInitials(name)
            }
            <div aria-hidden="true" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[8px] tracking-[0.2em] uppercase text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {avatarUploading ? '…' : 'Edit'}
              </span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="flex-1 pt-0.5">
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
              <button
                onClick={handleNameSave}
                disabled={nameSaving}
                className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {nameSaving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setNameEditing(false); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:opacity-70 transition-opacity"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <span
                className="text-2xl text-[var(--text-primary)]"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                {name}
              </span>
              <button
                onClick={() => { setNameEditing(true); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Edit
              </button>
            </div>
          )}
          {nameError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {nameError}</p>}
          {avatarError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {avatarError}</p>}
          <p className="text-sm text-[var(--text-muted)] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{email}</p>
          <div className="flex items-center gap-3 flex-wrap">
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

      {/* ── Sonant Submissions ── */}
      <div>
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[var(--text-muted)] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Sonant Submissions
        </div>
        {submissions.length === 0 ? (
          <p
            className="text-sm text-[var(--text-muted)] leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            No submissions yet. Browse active briefs below to find one worth writing to.
          </p>
        ) : (
          <div className="border-t border-[var(--border-base)]">
            {submissions.map((s) => {
              const status = STATUS_LABELS[s.status] ?? { label: s.status, color: 'text-[var(--text-muted)]' };
              const isActive = s.status === 'received' || s.status === 'in_review';
              return (
                <div
                  key={s.id}
                  className="border-b border-[var(--border-base)] py-4 flex items-center justify-between gap-6"
                >
                  <div>
                    <div
                      className="text-base text-[var(--text-primary)]"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                    >
                      {s.codename}
                    </div>
                    <div
                      className="text-[10px] text-[var(--text-dimmer)] mt-0.5"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-[10px] tracking-[0.2em] uppercase ${status.color}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {status.label}
                    </div>
                    {isActive && (
                      <div
                        className="text-[10px] text-[var(--text-dimmer)] mt-0.5"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        ~{SUBMISSION_TURNAROUND_DAYS} business days
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Credits + Browse action ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-t border-[var(--border-base)] pt-8">
        <div>
          <div
            className="text-sm text-[var(--text-primary)] mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {submissionCredits === 0
              ? 'No submission credits remaining.'
              : `${submissionCredits} submission credit${submissionCredits === 1 ? '' : 's'} available.`}
          </div>
          {submissionCredits === 0 && (
            <button
              onClick={() => startCheckout('submission')}
              disabled={checkoutLoading === 'submission'}
              className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors disabled:opacity-40"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {checkoutLoading === 'submission' ? '…' : `Buy a credit — $${isPro ? '5' : '10'} →`}
            </button>
          )}
        </div>
        <Link
          href="/browse"
          className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors shrink-0"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
        >
          ◆ Browse Sonant Briefs
        </Link>
      </div>

      {/* ── Feedback session module ── */}
      <div
        className="border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
        style={{ borderRadius: '2px' }}
      >
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[#E85D2F] mb-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Need feedback on a track?
        </div>
        <p
          className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Bring a work-in-progress. We&apos;ll compare it against your brief and give you clear next steps.
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {sessionCredits > 0
              ? `45 min · ${sessionCredits} session credit${sessionCredits === 1 ? '' : 's'} available`
              : isPro
                ? '45 min · $25 for Pro members'
                : '45 min · $50'}
          </div>
          {sessionCredits > 0 ? (
            <a
              href="https://cal.com/lukedespain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Book a feedback session →
            </a>
          ) : (
            <button
              onClick={() => startCheckout('session')}
              disabled={checkoutLoading === 'session'}
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40 shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {checkoutLoading === 'session' ? '…' : `Book a session — $${isPro ? '25' : '50'} →`}
            </button>
          )}
        </div>
      </div>

      {/* ── Your Practice ── */}
      <div>
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[var(--text-muted)] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Your Practice
        </div>
        {hasActivity ? (
          <div
            className="text-sm text-[var(--text-secondary)] flex flex-wrap gap-x-6 gap-y-1 mb-5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {stats.generations > 0 && (
              <span>{stats.generations} brief{stats.generations === 1 ? '' : 's'} generated</span>
            )}
            {stats.uploads > 0 && (
              <span>{stats.uploads} community upload{stats.uploads === 1 ? '' : 's'}</span>
            )}
            {stats.featured > 0 && (
              <span>{stats.featured} track{stats.featured === 1 ? '' : 's'} featured</span>
            )}
          </div>
        ) : (
          <p
            className="text-sm text-[var(--text-muted)] mb-5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            No practice briefs yet.
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/library"
            className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            My Library →
          </Link>
          <Link
            href="/generator"
            className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Generator →
          </Link>
        </div>
      </div>

      {/* ── Pro upgrade (compact, free users only) ── */}
      {!isPro && (
        <div
          className="border border-[#E85D2F]/30 bg-[#E85D2F]/5 p-6"
          style={{ borderRadius: '2px' }}
        >
          <div
            className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ Go Pro — $12/month
          </div>
          <p
            className="text-sm text-[var(--text-secondary)] mb-5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            3 submission credits/month · 50% off feedback sessions · welcome feedback call
          </p>
          <button
            onClick={() => startCheckout('pro')}
            disabled={checkoutLoading === 'pro'}
            className="text-[9px] tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            {checkoutLoading === 'pro' ? '◆ Redirecting…' : '◆ Upgrade to Pro'}
          </button>
        </div>
      )}

      {/* ── Sign out ── */}
      <div className="border-t border-[var(--border-base)] pt-6">
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sign Out
          </button>
        </form>
      </div>

    </div>
  );
}
