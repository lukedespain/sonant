'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setTrackVisibility } from '@/app/briefs/actions';
import { isVerifiedComposer, type VerifiedOverride } from '@/lib/verification';
import AdminVerificationControls from '@/components/AdminVerificationControls';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

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
  bio: initialBio,
  website: initialWebsite,
  tracks,
}: {
  profileId: string;
  isOwner: boolean;
  isAdmin?: boolean;
  name: string;
  avatarUrl: string | null;
  accepted: number;
  verifiedOverride?: VerifiedOverride;
  bio: string;
  website: string;
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
  const [isPending, startTransition] = useTransition();
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();

  const verified = isVerifiedComposer(accepted, verifiedOverride);
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

  function handlePlay(track: TrackItem) {
    const isActive = activeTrack?.url === track.fileUrl;
    if (isActive && isPlaying) pause();
    else play({ url: track.fileUrl, fileName: track.fileName, briefId: track.briefId, briefName: track.briefName });
  }

  return (
    <div className="flex-1">
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12 mb-16">
          <div className="shrink-0">
            <div className="relative w-24 h-24">
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl group"
                  style={{ background: avatarUrl ? undefined : avatarColor(profileId), ...sans, fontWeight: 500 }}
                  title="Change photo"
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : getInitials(displayName)}
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] tracking-[0.2em] uppercase" style={mono}>
                    {avatarUploading ? '…' : 'Edit'}
                  </span>
                </button>
              ) : (
                <div
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl"
                  style={{ background: avatarUrl ? undefined : avatarColor(profileId), ...sans, fontWeight: 500 }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : getInitials(displayName)}
                </div>
              )}
              {verified && (
                <span
                  className="absolute right-0 bottom-0 w-7 h-7 flex items-center justify-center bg-[#E85D2F] text-[var(--bg-base)] border-2 border-[var(--bg-base)]"
                  style={{ borderRadius: '999px' }}
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

          <div className="flex-1 min-w-0">
            {editing && isOwner ? (
              <div className="space-y-4 max-w-xl">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-3xl bg-transparent border-b border-[#E85D2F] focus:outline-none text-[var(--text-primary)] pb-1"
                  style={{ ...serif, fontWeight: 300 }}
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
                  className="tracking-tight leading-[1.05] mb-3"
                  style={{ ...serif, fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {displayName}
                </h1>
                {verified && (
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] mb-4" style={mono}>
                    Verified composer
                  </div>
                )}
                {bio && (
                  <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl mb-4" style={sans}>
                    {bio}
                  </p>
                )}
                {siteHref && (
                  <a
                    href={siteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 mb-4"
                    style={mono}
                  >
                    Portfolio →
                  </a>
                )}
                {isAdmin && (
                  <AdminVerificationControls
                    userId={profileId}
                    override={verifiedOverride}
                    accepted={accepted}
                  />
                )}
                {isOwner && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                      style={mono}
                    >
                      Edit profile
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={mono}>
            ◆ Tracks
          </div>
          {tracks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]" style={sans}>
              {isOwner ? 'Upload an MP3 to a brief to see it here.' : 'No public tracks yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => {
                const isActive = activeTrack?.url === track.fileUrl;
                const isCurrentlyPlaying = isActive && isPlaying;
                return (
                  <div
                    key={track.id}
                    className="border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3 flex items-center gap-3"
                    style={{ borderRadius: '2px' }}
                  >
                    <button
                      onClick={() => handlePlay(track)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                        isCurrentlyPlaying
                          ? 'bg-[#E85D2F] text-[var(--bg-base)]'
                          : 'bg-[#E85D2F]/15 text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[var(--bg-base)]'
                      }`}
                      aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrentlyPlaying ? '■' : '▶'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--text-secondary)] truncate block" style={sans}>
                        {track.fileName}
                        {isOwner && !track.isPublic && (
                          <span className="text-[var(--text-dimmer)]"> · private</span>
                        )}
                      </span>
                      <Link
                        href={`/browse/${track.briefId}`}
                        className="text-[10px] text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors truncate block"
                        style={mono}
                      >
                        {track.briefName}
                      </Link>
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
                        className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors disabled:opacity-40"
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
      </section>
    </div>
  );
}
