'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { signOut } from '@/app/auth/actions';
import { VERIFICATION_THRESHOLD } from '@/lib/verification';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

type Panel = 'email' | 'password' | 'delete' | null;

export default function AccountSettings({
  email: initialEmail,
  isAdmin,
  submissionCredits,
  verified,
  placed,
  badgeInfoOpen,
  onToggleBadgeInfo,
  checkoutLoading,
  onAddCredits,
}: {
  email: string;
  isAdmin: boolean;
  submissionCredits: number;
  verified: boolean;
  placed: number;
  badgeInfoOpen: boolean;
  onToggleBadgeInfo: () => void;
  checkoutLoading: boolean;
  onAddCredits: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  function open(next: Panel) {
    setPanel((cur) => (cur === next ? null : next));
    setError(null);
    setMessage(null);
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/profile/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: emailPassword }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(j.error ?? 'Could not update email.');
      return;
    }
    setEmail(j.email ?? newEmail);
    setNewEmail('');
    setEmailPassword('');
    setPanel(null);
    setMessage('Check the new inbox to confirm the change.');
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(j.error ?? 'Could not update password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPanel(null);
    setMessage('Password updated.');
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePassword, confirm: deleteConfirm }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(j.error ?? 'Could not delete account.');
      return;
    }
    window.location.href = '/';
  }

  return (
    <aside className="lg:sticky lg:top-28 h-fit">
      <h2
        className="text-3xl md:text-4xl tracking-tight mb-8"
        style={{ ...serif, fontWeight: 300 }}
      >
        Account<span className="italic">.</span>
      </h2>

      <div className="border-t border-[var(--border-base)]">
        <div className="py-5 border-b border-[var(--border-base)]">
          <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-2" style={mono}>
            {isAdmin ? 'Catalog reviews' : 'Submission credits'}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="text-3xl leading-none text-[var(--text-primary)]" style={{ ...serif, fontWeight: 300 }}>
              {isAdmin ? '∞' : submissionCredits}
            </div>
            {!isAdmin && (
              <button
                type="button"
                onClick={onAddCredits}
                disabled={checkoutLoading}
                className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40 mb-0.5"
                style={mono}
              >
                {checkoutLoading ? '…' : '+ Add'}
              </button>
            )}
          </div>
        </div>

        <div className="py-5 border-b border-[var(--border-base)]">
          <div className="relative flex items-center gap-1.5 group/badge mb-2">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
              Status
            </div>
            {!verified && (
              <button
                type="button"
                onClick={onToggleBadgeInfo}
                aria-expanded={badgeInfoOpen}
                aria-label="About the verified composer badge"
                className="relative shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1" />
                  <path d="M6 5.25v3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="6" cy="3.7" r="0.6" fill="currentColor" />
                </svg>
              </button>
            )}
            <div
              className={`absolute left-0 bottom-full mb-2 w-56 p-3 border border-[var(--border-card)] bg-[var(--bg-card)] text-[11px] leading-relaxed tracking-normal normal-case text-[var(--text-muted)] z-10 ${
                badgeInfoOpen ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover/badge:opacity-100'
              }`}
              style={{ ...sans, borderRadius: '2px' }}
              role="tooltip"
            >
              Place three tracks in the catalog to earn this badge. Verified composers get access to paid briefs.
            </div>
          </div>
          {verified ? (
            <div className="text-lg text-[#E85D2F]" style={{ ...serif, fontWeight: 400 }}>
              Verified Composer
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-[2px] flex-1 bg-[var(--border-base)] overflow-hidden" style={{ borderRadius: '2px' }}>
                <div
                  className="h-full bg-[#E85D2F]"
                  style={{ width: `${(placed / VERIFICATION_THRESHOLD) * 100}%` }}
                />
              </div>
              <div className="shrink-0 text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
                {placed} / {VERIFICATION_THRESHOLD}
              </div>
            </div>
          )}
        </div>

        <div className="py-5 border-b border-[var(--border-base)]">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
              Email
            </div>
            <button
              type="button"
              onClick={() => open('email')}
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
              style={mono}
            >
              {panel === 'email' ? 'Close' : 'Change'}
            </button>
          </div>
          <div className="text-sm text-[var(--text-primary)] break-all" style={sans}>
            {email || '—'}
          </div>
          {panel === 'email' && (
            <form onSubmit={changeEmail} className="mt-4 space-y-3">
              <Field
                label="New email"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                autoComplete="email"
              />
              <Field
                label="Current password"
                type="password"
                value={emailPassword}
                onChange={setEmailPassword}
                autoComplete="current-password"
                minLength={1}
              />
              <button type="submit" disabled={saving} className={actionClass} style={mono}>
                {saving ? '…' : 'Update email'}
              </button>
            </form>
          )}
        </div>

        <div className="py-5 border-b border-[var(--border-base)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
              Password
            </div>
            <button
              type="button"
              onClick={() => open('password')}
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
              style={mono}
            >
              {panel === 'password' ? 'Close' : 'Change'}
            </button>
          </div>
          {panel === 'password' && (
            <form onSubmit={changePassword} className="mt-4 space-y-3">
              <Field
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                minLength={1}
              />
              <Field
                label="New password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={8}
              />
              <Field
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                minLength={8}
              />
              <button type="submit" disabled={saving} className={actionClass} style={mono}>
                {saving ? '…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <div className="py-5 border-b border-[var(--border-base)]">
          <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-3" style={mono}>
            Appearance
          </div>
          <ThemeToggle label="Change Theme" />
        </div>

        {message && (
          <p className="pt-4 text-[11px] text-[#E85D2F]" style={sans}>{message}</p>
        )}
        {error && (
          <p className="pt-4 text-[11px] text-[#FF8B6B]" style={sans}>× {error}</p>
        )}

        <div className="pt-5 flex items-center justify-between gap-4">
          <form action={signOut}>
            <button
              type="submit"
              className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={mono}
            >
              Sign Out
            </button>
          </form>
          <button
            type="button"
            onClick={() => open('delete')}
            className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-dimmer)] hover:text-[#FF8B6B] transition-colors"
            style={mono}
          >
            Delete account
          </button>
        </div>

        {panel === 'delete' && (
          <form onSubmit={deleteAccount} className="mt-5 space-y-3">
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed" style={sans}>
              This permanently removes your profile, briefs, tracks, and submissions. Type DELETE to confirm.
            </p>
            <Field
              label="Type DELETE"
              type="text"
              value={deleteConfirm}
              onChange={setDeleteConfirm}
              autoComplete="off"
            />
            <Field
              label="Password"
              type="password"
              value={deletePassword}
              onChange={setDeletePassword}
              autoComplete="current-password"
              minLength={1}
            />
            <button
              type="submit"
              disabled={saving}
              className="text-[10px] tracking-[0.2em] uppercase text-[#FF8B6B] hover:opacity-70 disabled:opacity-40"
              style={mono}
            >
              {saving ? '…' : 'Delete my account'}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

const actionClass =
  'text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40';

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-2" style={mono}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none"
        style={{ ...sans, borderRadius: '2px' }}
      />
    </div>
  );
}
