'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
  email: string;
  tier: string;
  memberSince: string;
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

export default function AccountClient({ userId, initialName, initialAvatarUrl, email, tier, memberSince }: Props) {
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
    <div>
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-12">
        {/* Avatar */}
        <div className="relative shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-semibold focus:outline-none"
            style={{ background: avatarUrl ? undefined : color, fontFamily: "'DM Sans', sans-serif" }}
            title="Upload photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              getInitials(name)
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[9px] tracking-[0.2em] uppercase text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {avatarUploading ? '…' : 'Edit'}
              </span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Name + email */}
        <div className="flex-1 pt-1">
          {nameEditing ? (
            <div className="flex items-center gap-3 mb-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') { setNameEditing(false); setNameInput(name); } }}
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
                {nameSaving ? 'Saving…' : 'Save'}
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
              <span className="text-2xl text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
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
          {nameError && (
            <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {nameError}</p>
          )}
          {avatarError && (
            <p className="text-[10px] text-[#FF8B6B] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>× {avatarError}</p>
          )}
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{email}</p>
          <p className="text-[10px] text-[var(--text-dimmer)] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Click photo to update · JPG, PNG or WEBP · max 5 MB
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl">
        <InfoCard label="Tier" value={tier} />
        <InfoCard label="Briefs This Month" value="Unlimited" />
        <InfoCard label="Member Since" value={memberSince} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] p-5" style={{ borderRadius: '2px' }}>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div className="text-base" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
