'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BriefsTab() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [winFee, setWinFee] = useState('');
  const [demoFee, setDemoFee] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [discoInboxUrl, setDiscoInboxUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    'w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none';
  const labelClass = 'block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2';
  const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
  const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Add a client name.');
      return;
    }
    if (!sourceText.trim() && files.length === 0) {
      setError('Paste the brief or upload a file.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const body = new FormData();
    body.set('sourceText', sourceText);
    body.set('clientName', clientName);
    body.set('projectTitle', projectTitle);
    body.set('dueDate', dueDate);
    body.set('winFee', winFee);
    body.set('demoFee', demoFee);
    body.set('discoInboxUrl', discoInboxUrl);
    files.forEach((file) => body.append('files', file));

    const res = await fetch('/api/admin/client-briefs', { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Could not create the brief.');
      return;
    }
    const json = await res.json();
    router.push(`/browse/${json.briefId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8" style={sans}>
        Paste the client document, upload a photo, PDF, or Word file, then set the client, project title, and fees. Add client brief turns it into a published job for verified composers and emails them that it is live. Links in the paste become clickable on the published brief.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="client-name" className={labelClass} style={mono}>Client name</label>
          <input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. US Army"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
        <div>
          <label htmlFor="project-title" className={labelClass} style={mono}>Project title</label>
          <input
            id="project-title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. The Field Is The Teacher"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
        <div>
          <label htmlFor="due-date" className={labelClass} style={mono}>Due date</label>
          <input
            id="due-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="e.g. Sep 4, 2026"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
        <div>
          <label htmlFor="demo-fee" className={labelClass} style={mono}>Demo fee</label>
          <input
            id="demo-fee"
            value={demoFee}
            onChange={(e) => setDemoFee(e.target.value)}
            placeholder="e.g. $500"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="win-fee" className={labelClass} style={mono}>Win fee</label>
          <input
            id="win-fee"
            value={winFee}
            onChange={(e) => setWinFee(e.target.value)}
            placeholder="e.g. $5,000 · 70/30 composer"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="disco-inbox" className={labelClass} style={mono}>Disco inbox (optional)</label>
          <input
            id="disco-inbox"
            value={discoInboxUrl}
            onChange={(e) => setDiscoInboxUrl(e.target.value)}
            placeholder="https://s.disco.ac/… · blank uses the default inbox"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
      </div>

      <label htmlFor="client-brief-source" className={labelClass} style={mono}>
        Client brief
      </label>
      <textarea
        id="client-brief-source"
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        rows={10}
        placeholder="Paste the client brief here."
        className={`${fieldClass} mb-4`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const next = Array.from(e.target.files ?? []);
          setFiles((prev) => [...prev, ...next]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
          style={{ ...mono, borderRadius: '2px' }}
        >
          + Upload file
        </button>
        <span className="text-[10px] text-[var(--text-dimmer)]" style={mono}>
          Photo, PDF, or Word · max 15 MB
        </span>
      </div>

      {files.length > 0 && (
        <ul className="mb-6 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]"
              style={sans}
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#C5564A]"
                style={mono}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-[10px] text-[#FF8B6B] mb-4" style={mono}>× {error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="text-xs tracking-[0.15em] uppercase px-5 py-2.5 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50"
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        {submitting ? '◆ Writing brief…' : '+ Add client brief'}
      </button>
    </form>
  );
}
