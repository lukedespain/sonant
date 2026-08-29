'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { VERIFICATION_THRESHOLD, isVerifiedComposer } from '@/lib/verification';

type DashTab = 'submissions' | 'sessions';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  received:       { label: 'Received',       color: 'var(--text-muted)' },
  in_review:      { label: 'In review',       color: '#E8B82F' },
  feedback_ready: { label: 'Feedback ready',  color: '#88B04B' },
  accepted:       { label: 'Accepted',        color: '#88B04B' },
  not_accepted:   { label: 'Not selected',    color: 'var(--text-muted)' },
};

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
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

interface SubmissionRow {
  id: string;
  briefId: string;
  briefCodename: string;
  briefType?: string;
  status: string;
  feedback: string | null;
  createdAt: string;
}

interface Props {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  email: string;
  memberSince: string;
  submissionCredits: number;
  sessionCredits: number;
  catalogSubmissions: SubmissionRow[];
  initialTab?: string;
  signOutAction: () => Promise<void>;
}

export default function AccountClient({
  userId, initialName, initialAvatarUrl, email, memberSince,
  submissionCredits, sessionCredits, catalogSubmissions,
  initialTab, signOutAction,
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
  const [activeTab, setActiveTab] = useState<DashTab>(
    initialTab === 'sessions' ? 'sessions' : 'submissions'
  );
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

  async function startCheckout(type: 'submission' | 'session') {
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

  function toggleFeedback(id: string) {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const color = avatarColor(userId);
  const acceptedCount = catalogSubmissions.filter(
    (s) => s.status === 'accepted' && s.briefType !== 'client'
  ).length;
  const hasBadge = isVerifiedComposer(acceptedCount);

  const tabs: { key: DashTab; label: string; count: number }[] = [
    { key: 'submissions', label: 'Submissions', count: catalogSubmissions.length },
    { key: 'sessions',    label: 'Sessions',    count: 0 },
  ];

  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const serif = { fontFamily: "'Fraunces', serif" };
  const sans = { fontFamily: "'DM Sans', sans-serif" };

  return (
    <div className="space-y-10">

      {/* ── Profile header ── */}
      <div className="flex items-start gap-5 pt-4">
        <div className="shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-semibold focus:outline-none"
            style={{ background: avatarUrl ? undefined : color, ...sans }}
            title="Upload photo"
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              : getInitials(name)
            }
            <div aria-hidden="true" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[8px] tracking-[0.2em] uppercase text-white" style={mono}>
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
                style={{ ...serif, fontWeight: 300 }}
              />
              <button onClick={handleNameSave} disabled={nameSaving}
                className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40"
                style={mono}>
                {nameSaving ? '…' : 'Save'}
              </button>
              <button onClick={() => { setNameEditing(false); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:opacity-70 transition-opacity"
                style={mono}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl text-[var(--text-primary)]" style={{ ...serif, fontWeight: 300 }}>
                {name}
              </span>
              <button onClick={() => { setNameEditing(true); setNameInput(name); }}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={mono}>
                Edit
              </button>
            </div>
          )}
          {nameError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={mono}>× {nameError}</p>}
          {avatarError && <p className="text-[10px] text-[#FF8B6B] mb-1" style={mono}>× {avatarError}</p>}
          <p className="text-sm text-[var(--text-muted)] mb-2" style={sans}>{email}</p>
          <div className="flex items-center gap-3 flex-wrap">
            {hasBadge ? (
              <span
                className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 border border-[#E85D2F]/40 text-[#E85D2F]"
                style={{ ...mono, borderRadius: '2px' }}
              >
                ◆ Sonant Composer
              </span>
            ) : (
              <span
                className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-muted)]"
                style={{ ...mono, borderRadius: '2px' }}
                title="Three accepted catalog submissions earns the badge"
              >
                Badge {acceptedCount}/{VERIFICATION_THRESHOLD}
              </span>
            )}
            <span className="text-[10px] text-[var(--text-dimmer)]" style={mono}>
              1 submission credit / month
            </span>
          </div>
        </div>

        <div className="shrink-0 mt-1">
          <ThemeToggle />
        </div>
      </div>

      {/* ── Credit counters ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-5" style={{ borderRadius: '2px' }}>
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
            Catalog Submission Credits
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl text-[var(--text-primary)]" style={{ ...serif, fontWeight: 300 }}>
              {submissionCredits}
            </span>
            <button
              onClick={() => startCheckout('submission')}
              disabled={checkoutLoading === 'submission'}
              className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40 mb-0.5"
              style={mono}
            >
              {checkoutLoading === 'submission' ? '…' : '+ Add More'}
            </button>
          </div>
        </div>
        <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-5" style={{ borderRadius: '2px' }}>
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
            Feedback Session Credits
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl text-[var(--text-primary)]" style={{ ...serif, fontWeight: 300 }}>
              {sessionCredits}
            </span>
            <button
              onClick={() => startCheckout('session')}
              disabled={checkoutLoading === 'session'}
              className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity disabled:opacity-40 mb-0.5"
              style={mono}
            >
              {checkoutLoading === 'session' ? '…' : '+ Add More'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div>
        <div className="flex border-b border-[var(--border-base)] overflow-x-auto">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? 'text-[var(--text-primary)] border-[#E85D2F]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
              }`}
              style={mono}
            >
              {label}{count > 0 ? ` (${count})` : ''}
            </button>
          ))}
        </div>

        <div className="mt-8">

          {/* ── Submissions ── */}
          {activeTab === 'submissions' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
                  Your <span className="italic">submissions.</span>
                </h2>
              </div>

              {catalogSubmissions.length === 0 ? (
                <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 text-center" style={{ borderRadius: '2px' }}>
                  <p className="text-sm text-[var(--text-muted)] mb-5" style={sans}>No submissions yet.</p>
                  <Link
                    href="/browse"
                    className="inline-block px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Browse Briefs
                  </Link>
                </div>
              ) : (
                <div>
                  {catalogSubmissions.map((sub) => {
                    const statusConfig = STATUS_CONFIG[sub.status] ?? { label: sub.status, color: 'var(--text-muted)' };
                    const hasFeedback = !!sub.feedback;
                    const isExpanded = expandedFeedback.has(sub.id);
                    const isClient = sub.briefType === 'client';
                    return (
                      <div key={sub.id} className="border-b border-[var(--border-base)] py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="text-base text-[var(--text-primary)]" style={{ ...serif, fontWeight: 400 }}>
                                {sub.briefCodename}
                              </div>
                              <span
                                className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5"
                                style={{
                                  ...mono,
                                  borderRadius: '2px',
                                  color: isClient ? '#92A8D1' : '#E85D2F',
                                  background: isClient ? '#92A8D1' + '15' : '#E85D2F15',
                                  border: `1px solid ${isClient ? '#92A8D130' : '#E85D2F30'}`,
                                }}
                              >
                                {isClient ? 'Client' : 'Catalog'}
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-dimmer)]" style={mono}>
                              {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span
                              className="text-[10px] tracking-[0.2em] uppercase"
                              style={{ ...mono, color: statusConfig.color }}
                            >
                              {statusConfig.label}
                            </span>
                            {hasFeedback && (
                              <button
                                onClick={() => toggleFeedback(sub.id)}
                                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors border border-[var(--border-card)] px-3 py-1.5"
                                style={{ ...mono, borderRadius: '2px' }}
                              >
                                {isExpanded ? 'Hide' : 'View Written Feedback'}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExpanded && sub.feedback && (
                          <div
                            className="mt-4 border border-[var(--border-card)] bg-[var(--bg-card)] p-5"
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3" style={mono}>
                              Written Feedback
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap" style={sans}>
                              {sub.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Sessions ── */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
                  Feedback <span className="italic">sessions.</span>
                </h2>
                {sessionCredits > 0 ? (
                  <a
                    href="https://cal.com/sonant/feedback"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors shrink-0"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    Schedule Session →
                  </a>
                ) : (
                  <button
                    onClick={() => startCheckout('session')}
                    disabled={checkoutLoading === 'session'}
                    className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 shrink-0"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    {checkoutLoading === 'session' ? '…' : 'Buy Session · $50'}
                  </button>
                )}
              </div>

              <div className="space-y-8">
                <div>
                  <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3" style={mono}>
                    Upcoming Sessions
                  </div>
                  <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center" style={{ borderRadius: '2px' }}>
                    <p className="text-sm text-[var(--text-muted)]" style={sans}>No upcoming sessions.</p>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-3" style={mono}>
                    Past Sessions
                  </div>
                  <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center" style={{ borderRadius: '2px' }}>
                    <p className="text-sm text-[var(--text-muted)]" style={sans}>No past sessions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sign out ── */}
      <div className="border-t border-[var(--border-base)] pt-6">
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
            style={mono}
          >
            Sign Out
          </button>
        </form>
      </div>

    </div>
  );
}
