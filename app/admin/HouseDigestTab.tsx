'use client';

import { useMemo, useState } from 'react';
import { HOUSE_DIGEST_CLOSING, HOUSE_DIGEST_INTRO } from '@/lib/house-digest';
import {
  CATALOG_PARTNER_LIST,
  DEFAULT_CATALOG_PARTNER_ID,
  catalogPartnerById,
} from '@/lib/partners';

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function HouseDigestTab() {
  const [partnerId, setPartnerId] = useState(DEFAULT_CATALOG_PARTNER_ID);
  const [to, setTo] = useState(
    () => catalogPartnerById(DEFAULT_CATALOG_PARTNER_ID)?.digestContactEmail ?? '',
  );
  const [discoPlaylistUrl, setDiscoPlaylistUrl] = useState('');
  const [intro, setIntro] = useState(HOUSE_DIGEST_INTRO);
  const [tracks, setTracks] = useState('');
  const [closing, setClosing] = useState(HOUSE_DIGEST_CLOSING);
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
        intro,
        tracks,
        closing,
        test: testOnly,
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
        Send a Sonant-branded note to a music house with your Disco playlist link. They listen on Disco. You curate on Sonant. Leave a blank line between picks and each one becomes a bullet.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="digest-partner" className={labelClass} style={mono}>Music house</label>
          <select
            id="digest-partner"
            value={partnerId}
            onChange={(e) => {
              const nextId = e.target.value;
              setPartnerId(nextId);
              setTo(catalogPartnerById(nextId)?.digestContactEmail ?? '');
            }}
            className={fieldClass}
            style={{ ...sans, borderRadius: '2px' }}
          >
            {CATALOG_PARTNER_LIST.filter((p) => p.id !== 'sonant').map((p) => (
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

      <label htmlFor="digest-intro" className={labelClass} style={mono}>Body</label>
      <textarea
        id="digest-intro"
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
        rows={5}
        className={`${fieldClass} mb-4`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      <label htmlFor="digest-tracks" className={labelClass} style={mono}>This week&apos;s picks</label>
      <textarea
        id="digest-tracks"
        value={tracks}
        onChange={(e) => setTracks(e.target.value)}
        rows={10}
        placeholder={'Competence by Szymon is a great electronic rock track...\n\nWhat Was Felt by Szymon is a felt piano track...'}
        className={`${fieldClass} mb-4`}
        style={{ ...sans, borderRadius: '2px' }}
      />

      <label htmlFor="digest-closing" className={labelClass} style={mono}>Closing</label>
      <textarea
        id="digest-closing"
        value={closing}
        onChange={(e) => setClosing(e.target.value)}
        rows={5}
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
