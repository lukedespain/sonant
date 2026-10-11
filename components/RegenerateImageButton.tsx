'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn } from '@/components/ui';

export default function RegenerateImageButton({ briefId }: { briefId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/brief-image/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId }),
    });

    setLoading(false);

    if (!res.ok) {
      let msg = 'Generation failed';
      try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
      setError(msg);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="no-print">
      <button
        onClick={handleClick}
        disabled={loading}
        className={btn('secondary', 'sm')}
      >
        {loading ? '◆ Generating…' : '◆ Regenerate image'}
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
