'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
function siteHref(url: string) {
  const t = url.trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

type BriefCard = { id: string; mode: string; target: string; codename: string };

function BadgeIcon({ kind, earned }: { kind: 'generator' | 'submitter' | 'learner' | 'placer'; earned: boolean }) {
  const stroke = earned ? '#E85D2F' : 'var(--text-dimmer)';
  const fill = earned ? '#E85D2F' : 'none';
  const common = { fill: 'none' as const, stroke, strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (kind === 'generator') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="4" y="4" width="28" height="28" rx="2" {...common} />
        <path d="M18 11L21.2 16.8L27.5 17.5L22.8 21.7L24.1 28L18 24.6L11.9 28L13.2 21.7L8.5 17.5L14.8 16.8L18 11Z" fill={earned ? '#E85D2F' : 'none'} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'submitter') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="4" y="4" width="28" height="28" rx="2" {...common} />
        <path d="M18 11v10" {...common} />
        <path d="M13 17l5-6 5 6" {...common} />
        <path d="M11 25h14" {...common} />
      </svg>
    );
  }
  if (kind === 'learner') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="4" y="4" width="28" height="28" rx="2" {...common} />
        <path d="M12 18c0-3.3 2.7-6 6-6s6 2.7 6 6" {...common} />
        <circle cx="12" cy="20" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.4" />
        <circle cx="24" cy="20" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.4" />
        <path d="M12 20v4M24 20v4" {...common} />
      </svg>
    );
  }
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <rect x="4" y="4" width="28" height="28" rx="2" {...common} />
      <path d="M18 10v10" {...common} />
      <circle cx="18" cy="22.5" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.4" />
    </svg>
  );
}

const BADGES = [
  { id: 'generator', title: 'The Generator', how: 'Generate your first brief.' },
  { id: 'submitter', title: 'The Submitter', how: 'Submit your first track to a brief.' },
  { id: 'learner', title: 'The Learner', how: 'Book your first 1:1 session.' },
  { id: 'placer', title: 'The Placer', how: 'Get your first catalog placement.' },
] as const;

export default function ProfileView({
  profileId,
  isOwner,
  name: initialName,
  avatarUrl: initialAvatar,
  bio: initialBio,
  website: initialWebsite,
  briefsGenerated,
  tracksSubmitted,
  accepted,
  briefs,
}: {
  profileId: string;
  isOwner: boolean;
  name: string;
  avatarUrl: string | null;
  bio: string;
  website: string;
  briefsGenerated: number;
  tracksSubmitted: number;
  accepted: number;
  briefs: BriefCard[];
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
  const [openBadge, setOpenBadge] = useState<string | null>(null);

  const hasBadge = accepted >= 3;
  const displayName = name || 'Composer';

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: name.trim() || displayName,
        bio: bio.trim(),
        website: website.trim(),
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

  return (
    <div className="flex-1">
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
          <div className="shrink-0">
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
                  rows={3}
                  className="w-full text-sm bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-3 text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
                  style={{ ...sans, borderRadius: '2px' }}
                  placeholder="A short bio"
                />
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full text-sm bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-3 text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
                  style={{ ...sans, borderRadius: '2px' }}
                  placeholder="Portfolio or website"
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
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <h1
                    className="tracking-tight leading-[1.05]"
                    style={{ ...serif, fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                  >
                    {displayName}
                  </h1>
                  {hasBadge && (
                    <span
                      className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] border border-[#E85D2F]/40 px-2 py-1"
                      style={{ ...mono, borderRadius: '2px' }}
                    >
                      ◆ Sonant Composer
                    </span>
                  )}
                </div>
                {bio && (
                  <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl mb-4" style={sans}>
                    {bio}
                  </p>
                )}
                {website && (
                  <a
                    href={siteHref(website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs tracking-[0.15em] uppercase text-[#E85D2F] hover:opacity-70"
                    style={mono}
                  >
                    {website.replace(/^https?:\/\//i, '')} ↗
                  </a>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-4 block text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                    style={mono}
                  >
                    Edit profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <h2 className="text-2xl tracking-tight mb-8" style={{ ...serif, fontWeight: 300 }}>
            Stats.
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-xl">
            {[
              { n: String(briefsGenerated), label: 'Briefs generated' },
              { n: String(tracksSubmitted), label: 'Tracks submitted' },
              { n: String(accepted), label: 'Catalog placements' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl text-[var(--text-primary)] mb-1" style={{ ...serif, fontWeight: 300 }}>
                  {stat.n}
                </div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <h2 className="text-2xl tracking-tight mb-8" style={{ ...serif, fontWeight: 300 }}>
            Badges.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl items-start">
            {BADGES.map((badge) => {
              const earned =
                badge.id === 'generator' ? briefsGenerated >= 1
                : badge.id === 'submitter' ? tracksSubmitted >= 1
                : badge.id === 'learner' ? false
                : accepted >= 1;
              const open = openBadge === badge.id;
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setOpenBadge(open ? null : badge.id)}
                  className="text-left group flex flex-col items-start w-full"
                  aria-pressed={open}
                  aria-label={`${badge.title}. ${badge.how}`}
                >
                  <div
                    className={`w-16 h-16 shrink-0 flex items-center justify-center border mb-3 transition-colors ${
                      earned
                        ? 'border-[#E85D2F]/50 bg-[#E85D2F]/10'
                        : 'border-[var(--border-subtle)] bg-transparent opacity-50 group-hover:opacity-80'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <BadgeIcon kind={badge.id} earned={earned} />
                  </div>
                  <div
                    className={`text-sm mb-1 leading-snug min-h-[1.25rem] ${earned ? 'text-[var(--text-primary)]' : 'text-[var(--text-dimmer)]'}`}
                    style={{ ...serif, fontWeight: 400 }}
                  >
                    {badge.title}
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed min-h-[2.5rem] ${
                      open ? 'text-[var(--text-muted)] opacity-100' : 'text-[var(--text-dimmer)] opacity-0 group-hover:opacity-100'
                    }`}
                    style={sans}
                  >
                    {earned ? 'Earned.' : badge.how}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {briefs.length > 0 && (
        <section className="border-t border-[var(--border-base)]">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
            <h2 className="text-2xl tracking-tight mb-8" style={{ ...serif, fontWeight: 300 }}>
              Briefs.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefs.map((b) => (
                <Link
                  key={b.id}
                  href={`/browse/${b.id}`}
                  className="block border border-[var(--border-card)] bg-[var(--bg-card)] p-5 hover:border-[#E85D2F] transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="text-lg italic text-[var(--text-primary)] mb-1" style={{ ...serif, fontWeight: 400 }}>
                    {b.codename}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
                    {b.mode} {b.target ? `· ${b.target}` : ''}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
