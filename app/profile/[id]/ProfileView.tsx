'use client';

import { useRef, useState } from 'react';
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

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function ProfileView({
  profileId,
  isOwner,
  name: initialName,
  avatarUrl: initialAvatar,
  accepted,
}: {
  profileId: string;
  isOwner: boolean;
  name: string;
  avatarUrl: string | null;
  accepted: number;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const verified = accepted >= 3;
  const displayName = name || 'Composer';

  async function saveProfile() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name.trim() || displayName }),
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
                  title="Sonant Composer. Three catalog placements."
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
                    Sonant Composer
                  </div>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                    style={mono}
                  >
                    Edit name
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
