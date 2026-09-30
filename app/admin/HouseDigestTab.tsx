'use client';

import { useMemo, useState } from 'react';
import {
  CATALOG_PARTNER_LIST,
  DEFAULT_CATALOG_PARTNER_ID,
  catalogPartnerById,
} from '@/lib/partners';

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function HouseDigestTab() {
  const [partnerId, setPartnerId] = useState(DEFAULT_CATALOG_PARTNER_ID);
  const [to, setTo] = useState('');
  const [discoPlaylistUrl, setDiscoPlaylistUrl] = useState('');
  const [tracks, setTracks] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const partner = useMemo(() => catalogPartnerById(partnerId), [partnerId]);

  const fieldClass =
    'w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none';
  const labelClass = 'block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2';

  async function handleSend(testOnly: boolean) {
    if (sending) return;
    setSending(true);
    setError(null);
    setMessage(null);

    const res = await fetch('/api/admin/house-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        to: testOnly ? 'music@lukedespain.com' : to,
        discoPlaylistUrl,
        tracks,
        note: testOnly ? `[TEST] ${note}`.trim() : note,
      }),
    });

    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Could not send.');
      return;
    }
    setMessage(testOnly ? 'Test sent to music@lukedespain.com' : `Sent to ${to}`);
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8" style={sans}>
        Send a Sonant-branded note to a music house with your Disco playlist link. They listen on Disco. You curate on Sonant. Paste one track per line so the email lists what you picked.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="digest-partner" className={labelClass} style={mono}>Music house</label>
          <select
            id="digest-partner"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          >
            {CATALOG_PARTNER_LIST.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="digest-to" className={labelClass} style={mono}>Send to</label>
          <input
            id="digest-to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={partner?.digestContactEmail || 'jack@…'}
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          />
        </div>
      </div>

      <label htmlFor="digest-playlist" className={labelClass} style={mono}>Disco playlist URL</label>
      <input
        id="digest-playlist"
        value={discoPlaylistUrl}
        onChange={(e) => setDiscoPlaylistUrl(e.target.value)}
        placeholder="https://….disco.ac/playlist/…"
        className={`${fieldClass} mb-4`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      <label htmlFor="digest-tracks" className={labelClass} style={mono}>Tracks (one per line)</label>
      <textarea
        id="digest-tracks"
        value={tracks}
        onChange={(e) => setTracks(e.target.value)}
        rows={8}
        placeholder={'Composer Name · Track Title · Tribe Type Beat\nAnother Composer · Song · Tribe Type Beat'}
        className={`${fieldClass} mb-4`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      <label htmlFor="digest-note" className={labelClass} style={mono}>Short note (optional)</label>
      <textarea
        id="digest-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Anything you want Jack to know before he hits play."
        className={`${fieldClass} mb-6`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      {error && (
        <p className="text-[10px] text-[#FF8B6B] mb-4" style={mono}>× {error}</p>
      )}
      {message && (
        <p className="text-[10px] text-[var(--text-dimmer)] mb-4" style={mono}>{message}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={sending || !discoPlaylistUrl.trim()}
          onClick={() => handleSend(true)}
          className="text-xs tracking-[0.15em] uppercase px-5 py-2.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
          style={{ ...mono, borderRadius: '2px' }}
        >
          {sending ? '◆ Sending…' : 'Send test to me'}
        </button>
        <button
          type="button"
          disabled={sending || !to.trim() || !discoPlaylistUrl.trim()}
          onClick={() => handleSend(false)}
          className="text-xs tracking-[0.15em] uppercase px-5 py-2.5 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50"
          style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
        >
          {sending ? '◆ Sending…' : 'Send to house'}
        </button>
      </div>
    </div>
  );
}
