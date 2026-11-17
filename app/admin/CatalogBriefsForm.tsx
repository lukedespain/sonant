'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// This site only writes briefs for the Thought Collective catalogue.
const CATALOG_ID = 'thought-collective';

export default function CatalogBriefsForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] hover:border-[var(--border-subtle)] focus:border-[var(--signal-line)] focus:outline-none focus:ring-4 focus:ring-[var(--signal-soft)] transition-colors';
  const labelClass = 'block text-[13px] text-[var(--text-muted)] mb-1.5';
  const mono = { fontFamily: "var(--brand-mono)" } as const;
  const sans = { fontFamily: "var(--brand-sans)" } as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectTitle.trim()) {
      setError('Add a brief title.');
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
    body.set('projectTitle', projectTitle);
    body.set('catalogId', CATALOG_ID);
    files.forEach((file) => body.append('files', file));

    const res = await fetch('/api/admin/catalog-briefs', { method: 'POST', body });
    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Could not create the brief.');
      return;
    }
    const json = await res.json();
    router.push(`/briefs/${json.briefId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8" style={sans}>
        Paste the catalogue notes or upload a file. We write it up as a brief and make the cover image. Check it on the Briefs page, then use Email everyone in its admin tools when you want it to go out.
      </p>

      <div className="mb-4">
        <label htmlFor="catalog-title" className={labelClass} style={mono}>Brief title</label>
        <input
          id="catalog-title"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          placeholder="e.g. Tribe Type Beat"
          className={fieldClass}
          style={{ ...sans }}
        />
      </div>

      <label htmlFor="catalog-brief-source" className={labelClass} style={mono}>
        Catalogue notes
      </label>
      <textarea
        id="catalog-brief-source"
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        rows={10}
        placeholder="Paste the brief here. Groovy, playful, boom bap energy, references, whatever Jack sent."
        className={`${fieldClass} mb-4`}
        style={{ ...sans }}
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
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-[13px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-40"
          style={{ ...mono }}
        >
          + Upload file
        </button>
        <span className="text-[12px] text-[var(--text-dimmer)]" style={mono}>
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
                className="text-[12px] text-[var(--text-dimmer)] hover:text-[#C5564A]"
                style={mono}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-[12px] text-[var(--danger)] mb-4" style={mono}>× {error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-[14px] font-medium bg-[var(--accent)] text-[#0A0A0A] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ ...mono, fontWeight: 500 }}
      >
        {submitting ? 'Writing brief…' : 'Create brief'}
      </button>
    </form>
  );
}
