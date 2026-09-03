'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggestedDiscoFilename } from '@/lib/verification';
import { UploadRequestError, postJson } from '@/lib/upload-client';

type Props = {
  briefId: string;
  briefName: string;
  composerName: string;
  discoUrl: string | null;
  triggerClassName?: string;
  triggerLabel?: string;
};

export default function ClientBriefSubmitModal({
  briefId,
  briefName,
  composerName,
  discoUrl,
  triggerClassName,
  triggerLabel = '↗ Deliver on Disco',
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const filename = suggestedDiscoFilename(briefName, composerName);
  const canDeliver = !!discoUrl;

  function handleOpen() {
    setOpen(true);
    setError(null);
    setDone(false);
  }

  function handleClose() {
    if (logging) return;
    setOpen(false);
  }

  async function handleDeliver() {
    if (!discoUrl || logging) return;
    setLogging(true);
    setError(null);

    try {
      await postJson<{ url: string }>('/api/submissions/client-intent', { briefId });
      setDone(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof UploadRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not record the delivery.';
      setError(message);
      setDone(true);
    } finally {
      setLogging(false);
    }
  }

  async function copyFilename() {
    try {
      await navigator.clipboard.writeText(filename);
    } catch {
      // Clipboard can be blocked; the filename is still visible.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
      >
        {triggerLabel}
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
              <div className="text-center py-4">
                <div className="text-3xl text-[#E85D2F] mb-4">◆</div>
                <h2 className="text-2xl mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
                  Disco is open.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Deliver the WAV there. Name the file{' '}
                  <span className="text-[var(--text-secondary)]">{filename}</span> so we can match it to you.
                </p>
                <div className="flex flex-col gap-3">
                  {discoUrl && (
                    <a
                      href={discoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-[0.2em] uppercase px-6 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center"
                      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                    >
                      ↗ Open inbox
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs tracking-[0.2em] uppercase px-6 py-3 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ◆ Deliver on Disco
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Brief
                    </label>
                    <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {briefName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      File name
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-secondary)] truncate flex-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {filename}
                      </span>
                      <button
                        type="button"
                        onClick={copyFilename}
                        className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      WAV · no credit · send as many takes as you like
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-[10px] text-[#FF8B6B] mt-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    × {error}
                  </p>
                )}

                {!canDeliver && (
                  <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    This brief does not have a Disco inbox yet. Tell the Sonant team.
                  </p>
                )}

                <div className="flex gap-3 mt-8">
                  <a
                    href={discoUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDeliver}
                    aria-disabled={!canDeliver || logging}
                    className={`flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase text-center bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors ${
                      !canDeliver || logging ? 'opacity-40 pointer-events-none' : ''
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {logging ? '◆ Opening…' : '◆ Open Disco'}
                  </a>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={logging}
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
