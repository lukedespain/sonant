'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BriefImageUpload({
  briefId,
  hasImage,
}: {
  briefId: string;
  hasImage: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const body = new FormData();
    body.set('file', file);
    body.set('briefId', briefId);

    const res = await fetch('/api/brief-image/upload', { method: 'POST', body });
    setUploading(false);

    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const json = await res.json();
        msg = json.error ?? msg;
      } catch { /* ignore */ }
      setError(msg);
    } else {
      router.refresh();
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="no-print">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        {uploading ? '◆ Uploading…' : hasImage ? '◆ Replace Image' : '◆ Upload Image'}
      </button>
      {error && (
        <p
          className="text-[10px] text-[#FF8B6B] mt-1"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          × {error}
        </p>
      )}
    </div>
  );
}
