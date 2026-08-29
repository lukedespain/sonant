'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_LABEL,
  detectAudioKind,
  tooLargeMessage,
} from '@/lib/audio-upload';
import { UploadRequestError, postJson, putToSignedUrl } from '@/lib/upload-client';

/**
 * What one attempt at a submission is holding. The submission id doubles as the
 * primary key of the eventual row, so keeping the same ticket across a retry is
 * what makes the retry free: the server recognises the id and does not charge a
 * second credit. Minting a fresh one would look like a second submission.
 */
type Ticket = {
  submissionId: string;
  storagePath: string;
  signedUrl: string;
  contentType: string;
  /** Identifies the file and title this ticket was issued for. */
  fileKey: string;
  uploaded: boolean;
};

type Props = {
  briefId: string;
  projectName: string;
  alreadySubmitted: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  submissionCredits?: number;
  isAdmin?: boolean;
};

export default function SubmitTrackModal({
  briefId,
  projectName,
  alreadySubmitted,
  triggerClassName,
  triggerLabel = '↑ Submit Track',
  submissionCredits = 0,
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<Ticket | null>(null);

  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setOpen(true);
    setPendingFile(null);
    setTrackName('');
    setConfirmed(false);
    setError(null);
    setProgress(0);
    setDone(false);
    ticketRef.current = null;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!detectAudioKind(file.name, file.type)) {
      setError('Submissions need to be MP3 or WAV.');
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(tooLargeMessage(file.size, 'MP3 or WAV'));
      return;
    }
    setError(null);
    setPendingFile(file);
    setTrackName(file.name.replace(/\.[^.]+$/, ''));
  }

  function handleClose() {
    if (uploading) return;
    setOpen(false);
  }

  async function handleSubmit() {
    if (!pendingFile || !confirmed) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    const name = trackName.trim() || pendingFile.name;
    const fileKey = `${pendingFile.name}:${pendingFile.size}:${pendingFile.lastModified}:${name}`;

    // A ticket issued for a different file or title no longer describes what
    // is about to be sent, so it cannot be reused.
    if (ticketRef.current && ticketRef.current.fileKey !== fileKey) ticketRef.current = null;

    try {
      // The audio goes straight to storage; only these small JSON calls hit the
      // server, which is what keeps large WAVs from being rejected in transit.
      if (!ticketRef.current) {
        const minted = await postJson<{
          submissionId: string;
          storagePath: string;
          signedUrl: string;
          contentType: string;
        }>('/api/submissions/upload-url', {
          briefId,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          contentType: pendingFile.type,
          trackName: name,
        });
        ticketRef.current = { ...minted, fileKey, uploaded: false };
      }
      const ticket = ticketRef.current;

      if (ticket.uploaded) {
        // Only the confirm failed last time. The audio is already in storage,
        // so go straight back to it rather than paying for the upload again.
        setProgress(100);
      } else {
        try {
          await putToSignedUrl(ticket.signedUrl, pendingFile, ticket.contentType, setProgress);
        } catch (uploadError) {
          // The signed URL is single use and we cannot tell from here whether
          // it was consumed, so start the next attempt from a fresh one.
          // Nothing has been recorded or charged yet, so that costs nothing.
          ticketRef.current = null;
          throw uploadError;
        }
        ticket.uploaded = true;
      }

      await postJson('/api/submissions/upload', {
        submissionId: ticket.submissionId,
        briefId,
        storagePath: ticket.storagePath,
        trackName: name,
      });

      ticketRef.current = null;
      setDone(true);
      router.refresh();
    } catch (err) {
      // Keep the ticket unless the server has told us the audio is gone: if the
      // confirm actually landed and only its response was lost, retrying with
      // the same id is recognised as the same submission and stays free.
      if (err instanceof UploadRequestError && err.uploadGone) ticketRef.current = null;
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const hasCredit = isAdmin || submissionCredits > 0;
  const canSubmit = !!pendingFile && confirmed && trackName.trim().length > 0 && hasCredit;

  return (
    <>
      <button
        onClick={handleOpen}
        className={triggerClassName ?? "text-xs tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"}
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

                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Credits
                    </label>
                    <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {isAdmin
                        ? 'Sonant team · no credit used'
                        : `${submissionCredits} ${submissionCredits === 1 ? 'credit' : 'credits'} remaining · this uses 1`}
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
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/wave,audio/x-wav,.mp3,.wav"
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
                      MP3 or WAV · max {MAX_AUDIO_LABEL}
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
                      I understand this uses 1 submission credit. This goes privately to the Sonant team, not onto the playlist.
                    </span>
                  </label>
                </div>

                {!hasCredit && (
                  <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    You need a submission credit to send this in.{' '}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'submission' }),
                        });
                        if (res.ok) {
                          const { url } = await res.json();
                          window.location.href = url;
                        }
                      }}
                      className="text-[#E85D2F] hover:opacity-70"
                    >
                      Buy a credit
                    </button>
                    .
                  </p>
                )}

                {error && (
                  <p className="text-[10px] text-[#FF8B6B] mt-4 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    × {error}
                  </p>
                )}

                {uploading && (
                  <div className="mt-5">
                    <div className="h-[3px] w-full bg-[var(--bg-card)]" style={{ borderRadius: '2px' }}>
                      <div
                        className="h-full bg-[#E85D2F] transition-[width] duration-200"
                        style={{ width: `${progress}%`, borderRadius: '2px' }}
                      />
                    </div>
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {progress < 100 ? `Uploading ${progress}%` : 'Finishing up…'}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || uploading}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {uploading
                      ? progress < 100
                        ? `◆ Uploading ${progress}%`
                        : '◆ Finishing…'
                      : '◆ Submit Track'}
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
