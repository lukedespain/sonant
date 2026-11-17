'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import AlertsPanel from '@/app/profile/[id]/AlertsPanel';
import SubmissionHistory, { type SubmissionItem } from '@/components/SubmissionHistory';
import type { RightsInfo } from '@/lib/handoff';
import MyInfoPanel from './MyInfoPanel';
import SoundPicker from '@/components/SoundPicker';
import type { Sound } from '@/lib/sound';
import OfferCard, { type Offer } from './OfferCard';
import type { AppNotification } from '@/lib/notifications';
import { AppHeader, AppPage, StatusPill, btn, card, fieldLabel, inputClass } from '@/components/ui';

type Panel = 'name' | 'email' | 'password' | 'delete' | null;
type Tab = 'submissions' | 'profile';


export default function DashboardView({
  initialTab,
  rights: initialRights,
  offers,
  name: initialName,
  email: initialEmail,
  isAdmin,
  notifications = [],
  submissions,
  inReview,
  acceptedCount,
  verified,
  verificationThreshold,
  sound,
  genreOptions,
  moodOptions,
}: {
  initialTab: Tab;
  rights: RightsInfo;
  offers: Offer[];
  name: string;
  email: string;
  isAdmin: boolean;
  notifications?: AppNotification[];
  submissions: SubmissionItem[];
  inReview: number;
  acceptedCount: number;
  verified: boolean;
  verificationThreshold: number;
  sound: Sound;
  genreOptions: string[];
  moodOptions: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [panel, setPanel] = useState<Panel>(null);
  const tabParam = useSearchParams().get('tab');
  const tab: Tab =
    tabParam === 'profile' || tabParam === 'info' || tabParam === 'settings'
      ? 'profile'
      : tabParam === null
        ? initialTab
        : 'submissions';
  const [rights, setRights] = useState(initialRights);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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


  const firstName = name.trim().split(/\s+/)[0];

  if (tab === 'profile') {
    return (
      <AppPage width="narrow">
        <AppHeader title="Profile" description="Only Thought Collective sees this." />

        <section className="mb-10" id="rights">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-1">Rights and royalties</h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">Needed before you submit, so we can register and pay you.</p>
          <div className={`${card} p-6 md:p-8`}>
            <MyInfoPanel rights={rights} onSaved={setRights} />
          </div>
        </section>

        <section className="mb-10" id="sound">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-1">Your sound</h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">What you usually write. Briefs shows the best fits first.</p>
          <div className={`${card} p-6 md:p-8`}>
            <SoundPicker initial={sound} genreOptions={genreOptions} moodOptions={moodOptions} />
          </div>
        </section>

        <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4">Account</h2>
        <div className={`${card} divide-y divide-[var(--border-base)]`}>
          <SettingRow label="Name" value={displayName} open={panel === 'name'} onToggle={() => open('name')}>
            <form onSubmit={saveName} className="flex flex-col gap-3">
              <Field label="Name" type="text" value={nextName} onChange={setNextName} autoComplete="name" />
              <SaveButton saving={saving}>Save name</SaveButton>
            </form>
          </SettingRow>

          <SettingRow label="Email" value={email || 'None'} open={panel === 'email'} onToggle={() => open('email')}>
            <form onSubmit={changeEmail} className="flex flex-col gap-3">
              <Field label="New email" type="email" value={newEmail} onChange={setNewEmail} autoComplete="email" />
              <Field
                label="Current password"
                type="password"
                value={emailPassword}
                onChange={setEmailPassword}
                autoComplete="current-password"
                minLength={1}
              />
              <SaveButton saving={saving}>Update email</SaveButton>
            </form>
          </SettingRow>

          <SettingRow label="Password" value="••••••••" open={panel === 'password'} onToggle={() => open('password')}>
            <form onSubmit={changePassword} className="flex flex-col gap-3">
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
              <SaveButton saving={saving}>Update password</SaveButton>
            </form>
          </SettingRow>
        </div>

        {message && <p className="mt-4 text-[13px] text-[var(--positive)]">{message}</p>}
        {error && (
          <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <form action={signOut}>
            <button type="submit" className={btn('secondary', 'md')}>
              Sign out
            </button>
          </form>
          <button type="button" onClick={() => open('delete')} className={btn('ghost', 'sm')}>
            Delete account
          </button>
        </div>

        {panel === 'delete' && (
          <form onSubmit={deleteAccount} className="mt-6 rounded-2xl border border-[var(--danger-soft)] bg-[var(--bg-card)] p-6 flex flex-col gap-3">
            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
              This permanently removes your account, tracks, and submissions. Type DELETE to confirm.
            </p>
            <Field label="Type DELETE" type="text" value={deleteConfirm} onChange={setDeleteConfirm} autoComplete="off" />
            <Field
              label="Password"
              type="password"
              value={deletePassword}
              onChange={setDeletePassword}
              autoComplete="current-password"
              minLength={1}
            />
            <div>
              <button type="submit" disabled={saving} className={btn('danger', 'md')}>
                {saving ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </form>
        )}
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppHeader
        eyebrow={firstName ? `Hi ${firstName}` : undefined}
        title="Submissions"
        description="Everything you have sent, and where it stands."
        actions={
          <Link href="/briefs" className={btn('primary', 'md')}>
            Find a brief
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Submitted" value={String(submissions.length)} hint="Tracks you have sent us" />
        <Stat label="In review" value={String(inReview)} hint="With our team" />
        <Stat label="Accepted" value={String(acceptedCount)} hint="In the catalogue" />
        <div className={`${card} p-4 md:p-5 flex flex-col justify-between gap-3`}>
          <p className="text-[13px] text-[var(--text-muted)]">Roster</p>
          <div>
            {verified ? (
              <StatusPill tone="positive">Verified</StatusPill>
            ) : (
              <StatusPill tone="muted">Not yet</StatusPill>
            )}
            <p className="mt-2 text-[12px] text-[var(--text-dim)] leading-snug">
              {verified
                ? 'You get invited to client projects that fit your sound.'
                : `${verificationThreshold === 1 ? 'Your first accepted track' : `${verificationThreshold} accepted tracks`} puts you on it.`}
            </p>
          </div>
        </div>
      </div>

      {offers.length > 0 && (
        <section id="offers" className="mb-10 scroll-mt-24 flex flex-col gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.submissionId} offer={offer} rights={rights} onRightsSaved={setRights} />
          ))}
        </section>
      )}

      <section id="submissions" className="scroll-mt-24">
        <SubmissionHistory items={submissions} />
      </section>

      <section className="mt-12">
        <AlertsPanel initialItems={notifications} />
      </section>
    </AppPage>
  );
}

function Stat({ label, value, hint, highlight = false }: { label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <div className={`${card} p-4 md:p-5`}>
      <p className="text-[13px] text-[var(--text-muted)] flex items-center gap-2">
        {highlight && <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />}
        {label}
      </p>
      <p className="mt-2 text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-[12px] text-[var(--text-dim)] leading-snug">{hint}</p>
    </div>
  );
}

function SettingRow({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="px-5 md:px-6 py-4">
      <div className="flex items-center justify-between gap-4 min-h-10">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--text-muted)]">{label}</p>
          <p className="text-[14px] text-[var(--text-primary)] truncate">{value}</p>
        </div>
        <button type="button" onClick={onToggle} className={btn(open ? 'ghost' : 'secondary', 'sm')}>
          {open ? 'Cancel' : 'Change'}
        </button>
      </div>
      {open && <div className="mt-4 pb-1 max-w-md">{children}</div>}
    </div>
  );
}

function SaveButton({ saving, children }: { saving: boolean; children: ReactNode }) {
  return (
    <div className="pt-1">
      <button type="submit" disabled={saving} className={btn('primary', 'md')}>
        {saving ? 'Saving…' : children}
      </button>
    </div>
  );
}

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
      <label htmlFor={id} className={fieldLabel}>
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
        className={inputClass}
      />
    </div>
  );
}
