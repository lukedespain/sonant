'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CATALOG_PARTNERS,
  DEFAULT_CATALOG_PARTNER_ID,
} from '@/lib/partners';

const partners = Object.values(CATALOG_PARTNERS);

export default function CatalogBriefsForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [catalogId, setCatalogId] = useState(DEFAULT_CATALOG_PARTNER_ID);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    'w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none';
  const labelClass = 'block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2';
  const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
  const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

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
    body.set('catalogId', catalogId);
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
        Paste Jack&apos;s notes or upload his PDF. Add catalog brief writes it into the Sonant format and generates an image. Check the brief, then use Email everyone when you want it to go out.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="catalog-house" className={labelClass} style={mono}>Catalog</label>
          <select
            id="catalog-house"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          >
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="catalog-title" className={labelClass} style={mono}>Brief title</label>
          <input
            id="catalog-title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Tribe Type Beat"
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
      </div>

      <label htmlFor="catalog-brief-source" className={labelClass} style={mono}>
        Catalog notes
      </label>
      <textarea
        id="catalog-brief-source"
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        rows={10}
        placeholder="Paste the brief here. Groovy, playful, boom bap energy, references, whatever Jack sent."
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
        {submitting ? '◆ Writing brief…' : '+ Add catalog brief'}
      </button>
    </form>
  );
}
