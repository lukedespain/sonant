'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  briefId: string;
  projectName: string;
  alreadySubmitted: boolean;
};

export default function SubmitTrackModal({ briefId, projectName, alreadySubmitted }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setOpen(true);
    setPendingFile(null);
    setTrackName('');
    setConfirmed(false);
    setError(null);
    setDone(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setTrackName(file.name.replace(/\.[^.]+$/, ''));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    if (uploading) return;
    setOpen(false);
  }

  async function handleSubmit() {
    if (!pendingFile || !confirmed) return;
    setUploading(true);
    setError(null);

    const body = new FormData();
    body.set('file', pendingFile);
    body.set('briefId', briefId);
    body.set('trackName', trackName.trim() || pendingFile.name);

    const res = await fetch('/api/submissions/upload', { method: 'POST', body });
    setUploading(false);

    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const json = await res.json();
        msg = json.error ?? msg;
      } catch { /* empty */ }
      setError(msg);
    } else {
      setDone(true);
      router.refresh();
    }
  }

  const canSubmit = !!pendingFile && confirmed && trackName.trim().length > 0;

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        ↑ Submit Track
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(10, 9, 8, 0.85)' }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-card)] p-8"
            style={{ borderRadius: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              /* Success state */
              <div className="text-center py-4">
                <div className="text-3xl text-[#E85D2F] mb-4">◆</div>
                <h2 className="text-2xl mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
                  Track submitted.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Your track is in. You&apos;ll receive written feedback regardless of outcome.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs tracking-[0.2em] uppercase px-6 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                >
                  ◆ Done
                </button>
              </div>
            ) : (
              <>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ◆ Submit Track
                </div>

                <div className="space-y-5">
                  {/* Brief name (read-only) */}
                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Brief
                    </label>
                    <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {projectName}
                    </p>
                  </div>

                  {/* File picker */}
                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Track File
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/aiff,audio/aac,audio/mp4"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {pendingFile ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)] truncate flex-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {pendingFile.name}
                        </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors shrink-0"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors text-xs tracking-[0.2em] uppercase text-center"
                        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                      >
                        Choose file
                      </button>
                    )}
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      MP3, WAV, AIFF or AAC · max 100 MB
                    </p>
                  </div>

                  {/* Track name (editable) */}
                  {pendingFile && (
                    <div>
                      <label
                        htmlFor="submission-track-name"
                        className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Track Name
                      </label>
                      <input
                        id="submission-track-name"
                        type="text"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                      />
                    </div>
                  )}

                  {/* Already submitted notice */}
                  {alreadySubmitted && (
                    <div className="text-xs text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 leading-relaxed" style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                      You&apos;ve already submitted to this brief. This will be reviewed as a separate entry.
                    </div>
                  )}

                  {/* Confirmation checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                          confirmed ? 'bg-[#E85D2F] border-[#E85D2F]' : 'border-[var(--border-subtle)] group-hover:border-[#E85D2F]'
                        }`}
                        style={{ borderRadius: '2px' }}
                      >
                        {confirmed && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      I understand this uses one of my submissions for this round. Free accounts get 1 submission per round. Pro accounts get 3.
                    </span>
                  </label>
                </div>

                {error && (
                  <p className="text-[10px] text-[#FF8B6B] mt-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    × {error}
                  </p>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || uploading}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {uploading ? '◆ Uploading…' : '◆ Submit Track'}
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
