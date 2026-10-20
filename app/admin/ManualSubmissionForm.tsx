'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { putToSignedUrl } from '@/lib/upload-client';
import { btn } from '@/components/ui';

type BriefOption = { id: string; label: string };

const inputClass =
  'w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none';

export default function ManualSubmissionForm({ briefs }: { briefs: BriefOption[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [briefId, setBriefId] = useState('');
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
          briefId,
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
      setBriefId('');
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
    <details className="mb-8 border border-[var(--border-card)] rounded-[2px] bg-[var(--bg-card)]">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 py-4 flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--text-secondary)]">
          <span className="text-[var(--accent)]">+</span> Add a track sent outside Sonant
        </span>
        <span className="label text-[var(--text-dimmer)]">Email, WhatsApp, etc.</span>
      </summary>
      <form onSubmit={submit} className="px-5 pb-6 pt-1 grid gap-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
          The composer needs a Sonant account. This adds the track to the queue as if they submitted it, with no credit used. Then use Send or Accepted as usual, and they get the emails and the catalog sign-on.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="label text-[var(--text-muted)]">Composer email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="label text-[var(--text-muted)]">Catalog brief</span>
            <select required value={briefId} onChange={(e) => setBriefId(e.target.value)} className={inputClass}>
              <option value="">Pick a brief</option>
              {briefs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label text-[var(--text-muted)]">Track title</span>
            <input value={trackName} onChange={(e) => setTrackName(e.target.value)} placeholder="Rising Light" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className="label text-[var(--text-muted)]">Audio file (optional)</span>
            <input
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--text-secondary)] file:mr-3 file:h-9 file:px-3 file:border file:border-[var(--border-subtle)] file:bg-transparent file:text-[var(--text-primary)] file:rounded-[2px] file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em]"
            />
          </label>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={saving} className={btn('primary', 'sm')}>
            {saving ? (progress !== null ? `Uploading ${progress}%` : 'Adding…') : 'Add to queue'}
          </button>
          {error && <span role="alert" className="text-xs text-[#FF8B6B]">{error}</span>}
          {done && <span className="text-xs text-[var(--positive)]">{done}</span>}
        </div>
      </form>
    </details>
  );
}
