'use client';

import { useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

type DashTab = 'briefs' | 'tracks' | 'submissions' | 'sessions';

const MODE_LABELS: Record<string, string> = { brand: 'Brand', film: 'Film', games: 'Game' };

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

interface BriefRow {
  id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: { codename?: string; project?: string; [key: string]: unknown };
  created_at: string;
}

interface TrackRow {
  id: string;
  briefId: string;
  briefCodename: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

interface SubmissionRow {
  id: string;
  briefId: string;
  briefCodename: string;
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
  generatedBriefs: BriefRow[];
  uploadedTracks: TrackRow[];
  catalogSubmissions: SubmissionRow[];
  signOutAction: () => Promise<void>;
}

function TrackPlayButton({ url, fileName, briefId, briefCodename }: {
  url: string; fileName: string; briefId: string; briefCodename: string;
}) {
  const { track, isPlaying, play, pause } = useAudioPlayer();
  const isActive = track?.url === url;
  const isCurrentlyPlaying = isActive && isPlaying;
  return (
    <button
      onClick={() => isCurrentlyPlaying ? pause() : play({ url, fileName, briefId, briefName: briefCodename })}
      className="flex items-center justify-center w-7 h-7 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors shrink-0 text-[10px]"
      style={{ borderRadius: '50%' }}
      title={isCurrentlyPlaying ? 'Pause' : 'Play'}
    >
      {isCurrentlyPlaying ? '■' : '▶'}
    </button>
  );
}

export default function AccountClient({
  userId, initialName, initialAvatarUrl, email, memberSince,
  submissionCredits, sessionCredits, generatedBriefs, uploadedTracks,
  catalogSubmissions, signOutAction,
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
  const [activeTab, setActiveTab] = useState<DashTab>('briefs');
  const [briefSearch, setBriefSearch] = useState('');
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

  const filteredBriefs = useMemo(() => {
    if (!briefSearch.trim()) return generatedBriefs;
    const q = briefSearch.toLowerCase();
    return generatedBriefs.filter((b) => {
      const codename = b.generated_content?.codename?.toLowerCase() ?? '';
      const project = b.generated_content?.project?.toLowerCase() ?? '';
      return codename.includes(q) || project.includes(q) || b.target.toLowerCase().includes(q);
    });
  }, [generatedBriefs, briefSearch]);

  const tabs: { key: DashTab; label: string; count: number }[] = [
    { key: 'briefs',       label: 'Generated Briefs',    count: generatedBriefs.length },
    { key: 'tracks',       label: 'Uploaded Tracks',      count: uploadedTracks.length },
    { key: 'submissions',  label: 'Catalog Submissions',  count: catalogSubmissions.length },
    { key: 'sessions',     label: 'Feedback Sessions',    count: 0 },
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
            <span
              className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-muted)]"
              style={{ ...mono, borderRadius: '2px' }}
            >
              Beta
            </span>
            <span className="text-[10px] text-[var(--text-dimmer)]" style={mono}>
              1 submission credit / month
            </span>
          </div>
        </div>
      </div>

      {/* ── Credit counters ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-5" style={{ borderRadius: '2px' }}>
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={mono}>
            Submission Credits
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
            Session Credits
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

          {/* ── Generated Briefs ── */}
          {activeTab === 'briefs' && (
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
                  Your generated <span className="italic">briefs.</span>
                </h2>
                <Link
                  href="/generator"
                  className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors shrink-0"
                  style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                >
                  Generate Brief
                </Link>
              </div>

              {generatedBriefs.length > 0 && (
                <div className="mb-5">
                  <input
                    type="text"
                    value={briefSearch}
                    onChange={(e) => setBriefSearch(e.target.value)}
                    placeholder="Search briefs…"
                    className="w-full max-w-sm px-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] focus:border-[#E85D2F] focus:outline-none"
                    style={{ ...sans, borderRadius: '2px' }}
                  />
                </div>
              )}

              {generatedBriefs.length === 0 ? (
                <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 text-center" style={{ borderRadius: '2px' }}>
                  <p className="text-sm text-[var(--text-muted)] mb-5" style={sans}>
                    No briefs generated yet.
                  </p>
                  <Link
                    href="/generator"
                    className="inline-block px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Try the Generator
                  </Link>
                </div>
              ) : filteredBriefs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]" style={sans}>No briefs match your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBriefs.map((brief) => {
                    const codename = brief.generated_content?.codename ?? 'Untitled';
                    const project = brief.generated_content?.project;
                    const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
                    return (
                      <Link
                        key={brief.id}
                        href={`/browse/${brief.id}`}
                        className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-colors p-5 group"
                        style={{ borderRadius: '2px' }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3
                            className="text-lg leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors"
                            style={{ ...serif, fontWeight: 400 }}
                          >
                            <span className="italic">{codename}</span>
                            <span
                              className="not-italic mx-1.5 text-[10px] align-middle"
                              style={{ ...mono, color: 'var(--text-dimmer)' }}
                            >/</span>
                            <span
                              className="text-[10px] tracking-[0.2em] uppercase not-italic align-middle"
                              style={{ ...mono, color: 'var(--text-muted)', fontWeight: 400 }}
                            >{modeLabel}</span>
                          </h3>
                          <span className="text-[10px] text-[var(--text-dimmer)] shrink-0 mt-1" style={mono}>
                            {new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {project && (
                          <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2" style={sans}>{project}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="text-[10px] tracking-wider px-2 py-0.5 text-[#E85D2F] border border-[#E85D2F]/30 bg-[#E85D2F]/5"
                            style={{ ...mono, borderRadius: '2px' }}
                          >{brief.target}</span>
                          {[...brief.genres.slice(0, 2), ...brief.moods.slice(0, 1)].map((tag, i) => (
                            <span
                              key={`${tag}-${i}`}
                              className="text-[10px] tracking-wider px-2 py-0.5 bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border-card)]"
                              style={{ ...mono, borderRadius: '2px' }}
                            >{tag}</span>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Uploaded Tracks ── */}
          {activeTab === 'tracks' && (
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
                  Your uploaded <span className="italic">tracks.</span>
                </h2>
                <Link
                  href="/browse?tab=community"
                  className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors shrink-0"
                  style={{ ...mono, borderRadius: '2px' }}
                >
                  Browse Briefs
                </Link>
              </div>

              {uploadedTracks.length === 0 ? (
                <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 text-center" style={{ borderRadius: '2px' }}>
                  <p className="text-sm text-[var(--text-muted)] mb-5" style={sans}>No tracks uploaded yet.</p>
                  <Link
                    href="/browse?tab=community"
                    className="inline-block px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Browse Community Briefs
                  </Link>
                </div>
              ) : (
                <div className="border-t border-[var(--border-base)]">
                  {uploadedTracks.map((track) => (
                    <div key={track.id} className="border-b border-[var(--border-base)] py-4 flex items-center gap-4">
                      <TrackPlayButton
                        url={track.fileUrl}
                        fileName={track.fileName}
                        briefId={track.briefId}
                        briefCodename={track.briefCodename}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--text-primary)] truncate" style={sans}>
                          {track.fileName}
                        </div>
                        <Link
                          href={`/browse/${track.briefId}`}
                          className="text-[10px] text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                          style={mono}
                        >
                          {track.briefCodename}
                        </Link>
                      </div>
                      <span className="text-[10px] text-[var(--text-dimmer)] shrink-0" style={mono}>
                        {new Date(track.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Catalog Submissions ── */}
          {activeTab === 'submissions' && (
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
                  Your catalog <span className="italic">submissions.</span>
                </h2>
                <Link
                  href="/browse"
                  className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors shrink-0"
                  style={{ ...mono, borderRadius: '2px' }}
                >
                  Browse Briefs
                </Link>
              </div>

              {catalogSubmissions.length === 0 ? (
                <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 text-center" style={{ borderRadius: '2px' }}>
                  <p className="text-sm text-[var(--text-muted)] mb-5" style={sans}>No catalog submissions yet.</p>
                  <Link
                    href="/browse"
                    className="inline-block px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    ◆ Browse Sonant Briefs
                  </Link>
                </div>
              ) : (
                <div>
                  {catalogSubmissions.map((sub) => {
                    const statusConfig = STATUS_CONFIG[sub.status] ?? { label: sub.status, color: 'var(--text-muted)' };
                    const hasFeedback = !!sub.feedback;
                    const isExpanded = expandedFeedback.has(sub.id);
                    return (
                      <div key={sub.id} className="border-b border-[var(--border-base)] py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-base text-[var(--text-primary)]" style={{ ...serif, fontWeight: 400 }}>
                              {sub.briefCodename}
                            </div>
                            <div className="text-[10px] text-[var(--text-dimmer)] mt-0.5" style={mono}>
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

          {/* ── Feedback Sessions ── */}
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
                    {checkoutLoading === 'session' ? '…' : 'Buy Session — $50'}
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
