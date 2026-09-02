'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setTrackVisibility } from '@/app/briefs/actions';
import { isVerifiedComposer, VERIFICATION_THRESHOLD, type VerifiedOverride } from '@/lib/verification';
import AdminVerificationControls from '@/components/AdminVerificationControls';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import PlayPauseIcon from '@/components/PlayPauseIcon';
import AccountSettings from './AccountSettings';

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

type TrackItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  briefId: string;
  briefName: string;
  isPublic: boolean;
};

export default function ProfileView({
  profileId,
  isOwner,
  isAdmin = false,
  name: initialName,
  avatarUrl: initialAvatar,
  accepted,
  verifiedOverride = null,
  submissionCredits = 0,
  bio: initialBio,
  website: initialWebsite,
  email = '',
  daysUntilNextCredit = null,
  tracks,
}: {
  profileId: string;
  isOwner: boolean;
  isAdmin?: boolean;
  name: string;
  avatarUrl: string | null;
  accepted: number;
  verifiedOverride?: VerifiedOverride;
  submissionCredits?: number;
  bio: string;
  website: string;
  email?: string;
  daysUntilNextCredit?: number | null;
  tracks: TrackItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [website, setWebsite] = useState(initialWebsite);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [badgeInfoOpen, setBadgeInfoOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();

  const verified = isVerifiedComposer(accepted, verifiedOverride);
  const placed = isAdmin ? VERIFICATION_THRESHOLD : Math.min(accepted, VERIFICATION_THRESHOLD);
  const displayName = name || 'Composer';
  const siteHref = website
    ? /^https?:\/\//i.test(website) ? website : `https://${website}`
    : '';

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name.trim() || displayName,
        bio,
        website,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Could not save');
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAvatarUploading(true);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body });
    setAvatarUploading(false);
    if (res.ok) {
      const { avatar_url } = await res.json();
      setAvatarUrl(avatar_url);
      router.refresh();
    }
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'submission' }),
    });
    setCheckoutLoading(false);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  }

  function handlePlay(track: TrackItem) {
    const isActive = activeTrack?.url === track.fileUrl;
    if (isActive && isPlaying) pause();
    else play({ url: track.fileUrl, fileName: track.fileName, briefId: track.briefId, briefName: track.briefName });
  }

  return (
    <div className="flex-1">
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-5"
          style={mono}
        >
          {isOwner ? 'Your profile' : 'Composer'}
        </div>

        <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-8 md:gap-16">
          <div className="flex-1 min-w-0">
            {editing && isOwner ? (
              <div className="space-y-4 max-w-xl">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#E85D2F] focus:outline-none text-[var(--text-primary)] pb-1"
                  style={{ ...serif, fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                  placeholder="Name"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="A short bio"
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
                  style={{ ...sans, borderRadius: '2px' }}
                />
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Portfolio link"
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
                  style={{ ...sans, borderRadius: '2px' }}
                />
                {error && <p className="text-[10px] text-[#FF8B6B]" style={mono}>× {error}</p>}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40"
                    style={mono}
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setName(initialName);
                      setBio(initialBio);
                      setWebsite(initialWebsite);
                      setError(null);
                    }}
                    className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]"
                    style={mono}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1
                  className="tracking-tight leading-[0.95] mb-4"
                  style={{ ...serif, fontWeight: 300, fontSize: 'clamp(2.5rem, 6vw, 4.75rem)' }}
                >
                  {displayName}
                </h1>
                {verified && (
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] mb-5" style={mono}>
                    Verified composer
                  </div>
                )}
                {bio && (
                  <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl mb-6" style={sans}>
                    {bio}
                  </p>
                )}
                <div className="flex items-center gap-5 flex-wrap">
                  {siteHref && (
                    <a
                      href={siteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
                      style={mono}
                    >
                      Portfolio →
                    </a>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                      style={mono}
                    >
                      Edit profile
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <AdminVerificationControls
                    userId={profileId}
                    override={verifiedOverride}
                    accepted={accepted}
                  />
                )}
              </>
            )}
          </div>

          <div className="shrink-0">
            <div className="relative w-28 h-28 md:w-36 md:h-36">
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="relative w-full h-full overflow-hidden flex items-center justify-center text-white text-2xl md:text-3xl group"
                  style={{
                    background: avatarUrl ? undefined : avatarColor(profileId),
                    ...sans,
                    fontWeight: 500,
                    borderRadius: '2px',
                  }}
                  title="Change photo"
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : getInitials(displayName)}
                  <span
                    className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] tracking-[0.2em] uppercase"
                    style={mono}
                  >
                    {avatarUploading ? '…' : 'Edit'}
                  </span>
                </button>
              ) : (
                <div
                  className="w-full h-full overflow-hidden flex items-center justify-center text-white text-2xl md:text-3xl"
                  style={{
                    background: avatarUrl ? undefined : avatarColor(profileId),
                    ...sans,
                    fontWeight: 500,
                    borderRadius: '2px',
                  }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : getInitials(displayName)}
                </div>
              )}
              {verified && (
                <span
                  className="absolute -right-1.5 -bottom-1.5 w-7 h-7 flex items-center justify-center bg-[#E85D2F] text-[var(--bg-base)]"
                  style={{ borderRadius: '2px' }}
                  title="Verified composer. Three catalog placements."
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6.2l2.6 2.6L10 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
            {isOwner && (
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className={`max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-1 gap-16 ${isOwner ? 'lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-20' : ''}`}>
          <div>
            <div className="flex items-baseline justify-between gap-4 mb-8">
              <h2
                className="text-3xl md:text-4xl tracking-tight"
                style={{ ...serif, fontWeight: 300 }}
              >
                Tracks<span className="italic">.</span>
              </h2>
              <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </div>
            </div>

            {tracks.length === 0 ? (
              <div
                className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
                style={{ borderRadius: '2px' }}
              >
                <h3 className="text-2xl tracking-tight mb-4" style={{ ...serif, fontWeight: 300 }}>
                  {isOwner ? 'No tracks yet.' : 'No public tracks yet.'}
                </h3>
                {isOwner && (
                  <>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
                      Write to a brief in the Library and upload a take. It shows up here.
                    </p>
                    <Link
                      href="/browse"
                      className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                      style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                    >
                      ◆ Open the Library
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="border-t border-[var(--border-base)]">
                {tracks.map((track) => {
                  const isActive = activeTrack?.url === track.fileUrl;
                  const isCurrentlyPlaying = isActive && isPlaying;
                  return (
                    <div
                      key={track.id}
                      className="border-b border-[var(--border-base)] py-5 flex items-center gap-4"
                    >
                      <button
                        onClick={() => handlePlay(track)}
                        className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors ${
                          isCurrentlyPlaying
                            ? 'bg-[#E85D2F] text-[#0A0908]'
                            : 'bg-[#0A0908] text-[#E85D2F]'
                        }`}
                        style={{ borderRadius: '2px' }}
                        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                      >
                        <PlayPauseIcon playing={isCurrentlyPlaying} size={11} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-lg text-[var(--text-primary)] truncate"
                          style={{ ...serif, fontWeight: 400 }}
                        >
                          {track.fileName.replace(/\.[^/.]+$/, '')}
                        </div>
                        {track.briefName.toLowerCase() !== track.fileName.replace(/\.[^/.]+$/, '').toLowerCase() && (
                          <Link
                            href={`/browse/${track.briefId}`}
                            className="text-[10px] tracking-[0.12em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors truncate block mt-0.5"
                            style={mono}
                          >
                            {track.briefName}
                          </Link>
                        )}
                      </div>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            startTransition(async () => {
                              await setTrackVisibility(track.id, !track.isPublic);
                              router.refresh();
                            });
                          }}
                          disabled={isPending}
                          className="shrink-0 text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors disabled:opacity-40"
                          style={mono}
                        >
                          {track.isPublic ? 'Public' : 'Private'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isOwner && (
            <AccountSettings
              email={email}
              isAdmin={isAdmin}
              submissionCredits={submissionCredits}
              verified={verified}
              placed={placed}
              badgeInfoOpen={badgeInfoOpen}
              onToggleBadgeInfo={() => setBadgeInfoOpen((o) => !o)}
              checkoutLoading={checkoutLoading}
              onAddCredits={startCheckout}
              daysUntilNextCredit={daysUntilNextCredit}
            />
          )}
        </div>
      </section>
    </div>
  );
}
