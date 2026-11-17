'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { putToSignedUrl } from '@/lib/upload-client';
import { btn } from '@/components/ui';
import { CATALOG_PARTNER_LIST, DEFAULT_CATALOG_PARTNER_ID } from '@/lib/partners';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] hover:border-[var(--border-subtle)] focus:border-[var(--signal-line)] focus:outline-none focus:ring-4 focus:ring-[var(--signal-soft)] transition-colors';

export type ComposerOption = { email: string; name: string };

export default function ManualSubmissionForm({ composers }: { composers: ComposerOption[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [catalogId, setCatalogId] = useState<string>(DEFAULT_CATALOG_PARTNER_ID);
  const [trackName, setTrackName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch('/api/admin/submissions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          composerEmail: email,
          briefUrl,
          catalogId,
          trackName,
          fileName: file?.name,
          fileSize: file?.size,
          contentType: file?.type,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        upload?: { signedUrl: string; contentType: string } | null;
      };
      if (!res.ok) throw new Error(json.error ?? 'Could not add the submission.');
      if (file && json.upload) {
        setProgress(0);
        await putToSignedUrl(json.upload.signedUrl, file, json.upload.contentType, setProgress);
      }
      setDone(`Added ${trackName || file?.name || 'the track'} to the queue. Find it below and mark it like any other.`);
      setEmail('');
      setBriefUrl('');
      setTrackName('');
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the submission.');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  return (
    <details className="group mb-8 border border-[var(--border-card)] rounded-2xl bg-[var(--bg-card)] open:pb-1">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 h-14 flex items-center justify-between gap-4 rounded-2xl hover:bg-[var(--bg-card-hover)] transition-colors">
        <span className="text-[14px] text-[var(--text-secondary)] flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-open:rotate-45 transition-transform">+</span>
          Add a track that came in by email or WhatsApp
        </span>
        <span className="hidden sm:inline text-[12px] text-[var(--text-dimmer)]">No credit used</span>
      </summary>
      <form onSubmit={submit} className="px-5 pb-6 pt-1 grid gap-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
          The composer needs an account here. Paste the link to any brief they wrote to, practice briefs included, and pick the catalog it is going to. This adds the track to the queue with no credit used. Then use Send or Accepted as usual, and they get the emails and that catalog&apos;s sign-on.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-[13px] text-[var(--text-muted)]">Composer email</span>
            <input
              type="email"
              required
              list="sonant-composers"
              autoComplete="off"
              placeholder="Start typing a name or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <datalist id="sonant-composers">
              {composers.map((c) => (
                <option key={c.email} value={c.email} label={c.name || c.email} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] text-[var(--text-muted)]">Brief link</span>
            <input
              required
              value={briefUrl}
              onChange={(e) => setBriefUrl(e.target.value)}
              placeholder="Paste the brief link"
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] text-[var(--text-muted)]">Catalog</span>
            <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className={inputClass}>
              {CATALOG_PARTNER_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] text-[var(--text-muted)]">Track title</span>
            <input value={trackName} onChange={(e) => setTrackName(e.target.value)} placeholder="Rising Light" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] text-[var(--text-muted)]">Audio file (optional)</span>
            <input
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--text-secondary)] file:mr-3 file:h-9 file:px-3 file:border file:border-[var(--border-subtle)] file:bg-transparent file:text-[var(--text-primary)] file:rounded-full file:text-[13px]"
            />
          </label>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={saving} className={btn('primary', 'sm')}>
            {saving ? (progress !== null ? `Uploading ${progress}%` : 'Adding…') : 'Add to queue'}
          </button>
          {error && <span role="alert" className="text-xs text-[var(--danger)]">{error}</span>}
          {done && <span className="text-xs text-[var(--positive)]">{done}</span>}
        </div>
      </form>
    </details>
  );
}
