'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import AlertsPanel from '@/app/profile/[id]/AlertsPanel';
import type { AppNotification } from '@/lib/notifications';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

type Panel = 'name' | 'email' | 'password' | 'delete' | null;

export default function AccountView({
  name: initialName,
  email: initialEmail,
  isAdmin,
  submissionCredits,
  daysUntilNextCredit = null,
  notifications = [],
}: {
  name: string;
  email: string;
  isAdmin: boolean;
  submissionCredits: number;
  daysUntilNextCredit?: number | null;
  notifications?: AppNotification[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [nextName, setNextName] = useState(initialName);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const displayName = name || 'Composer';

  function open(next: Panel) {
    setPanel((cur) => (cur === next ? null : next));
    setError(null);
    setMessage(null);
    if (next === 'name') setNextName(name);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nextName.trim() }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(j.error ?? 'Could not update name.');
      return;
    }
    setName(nextName.trim());
    setPanel(null);
    setMessage('Name updated.');
    router.refresh();
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

  return (
    <div className="pt-16 md:pt-20 pb-20 flex-1 min-w-0 overflow-x-clip">
      <div className="max-w-2xl mx-auto px-6 md:px-10">
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-5"
          style={mono}
        >
          Your account
        </div>
        <h1
          className="tracking-tight leading-[0.95] mb-3"
          style={{ ...serif, fontWeight: 300, fontSize: 'clamp(2.5rem, 6vw, 4.25rem)' }}
        >
          {displayName}
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-12" style={sans}>
          Update your name, email, and password. Uploads and submissions live in Catalog.
        </p>

        <div className="border-t border-[var(--border-base)]">
          <SettingRow
            label="Name"
            action={panel === 'name' ? 'Close' : 'Change'}
            onAction={() => open('name')}
          >
            <div className="text-sm text-[var(--text-primary)]" style={sans}>
              {displayName}
            </div>
            {panel === 'name' && (
              <form onSubmit={saveName} className="mt-4 space-y-3">
                <Field label="Name" type="text" value={nextName} onChange={setNextName} autoComplete="name" />
                <button type="submit" disabled={saving} className={actionClass} style={mono}>
                  {saving ? '…' : 'Save name'}
                </button>
              </form>
            )}
          </SettingRow>

          <SettingRow
            label="Email"
            action={panel === 'email' ? 'Close' : 'Change'}
            onAction={() => open('email')}
          >
            <div className="text-sm text-[var(--text-primary)] break-all" style={sans}>
              {email || '—'}
            </div>
            {panel === 'email' && (
              <form onSubmit={changeEmail} className="mt-4 space-y-3">
                <Field label="New email" type="email" value={newEmail} onChange={setNewEmail} autoComplete="email" />
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
          </SettingRow>

          <SettingRow
            label="Password"
            action={panel === 'password' ? 'Close' : 'Change'}
            onAction={() => open('password')}
          >
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
          </SettingRow>

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
                  onClick={startCheckout}
                  disabled={checkoutLoading}
                  className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40 mb-0.5"
                  style={mono}
                >
                  {checkoutLoading ? '…' : '+ Add'}
                </button>
              )}
            </div>
            {!isAdmin && daysUntilNextCredit != null && (
              <p className="mt-2 text-[10px] tracking-[0.12em] uppercase text-[var(--text-dimmer)]" style={mono}>
                Next free credit in {daysUntilNextCredit} {daysUntilNextCredit === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
        </div>

        {message && (
          <p className="pt-5 text-[11px] text-[#E85D2F]" style={sans}>{message}</p>
        )}
        {error && (
          <p className="pt-5 text-[11px] text-[#FF8B6B]" style={sans}>× {error}</p>
        )}

        <div className="pt-8">
          <Link
            href="/catalog"
            className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
            style={mono}
          >
            View catalog →
          </Link>
        </div>

        <div className="pt-8 flex items-center justify-between gap-4">
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
              This permanently removes your account, briefs, tracks, and submissions. Type DELETE to confirm.
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

        <section className="mt-20 pt-16 border-t border-[var(--border-base)]">
          <AlertsPanel initialItems={notifications} />
        </section>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  action,
  onAction,
  children,
}: {
  label: string;
  action: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="py-5 border-b border-[var(--border-base)]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]" style={mono}>
          {label}
        </div>
        <button
          type="button"
          onClick={onAction}
          className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
          style={mono}
        >
          {action}
        </button>
      </div>
      {children}
    </div>
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
