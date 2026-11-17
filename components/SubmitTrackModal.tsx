'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { btn, fieldLabel, inputClass } from '@/components/ui';
import { IconCheck, IconClose, IconUpload, IconWaveform } from '@/components/shell/icons';
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_LABEL,
  detectAudioKind,
  tooLargeMessage,
} from '@/lib/audio-upload';
import { UploadRequestError, postJson, putToSignedUrl } from '@/lib/upload-client';
import { useWindowFileDrop } from '@/lib/use-window-file-drop';

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
  triggerLabel = 'Submit track',
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

  const acceptFile = useCallback((file: File) => {
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
  }, []);

  const dragging = useWindowFileDrop(open && !done && !uploading, acceptFile);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (file) acceptFile(file);
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
      <button type="button" onClick={handleOpen} className={triggerClassName ?? btn('accent', 'md')}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/75 animate-fade"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Submit your track"
        >
          {dragging && (
            <div
              className="pointer-events-none absolute inset-4 rounded-3xl border-2 border-dashed border-[var(--signal)]"
              aria-hidden
            />
          )}
          <div
            className="relative w-full sm:max-w-[460px] bg-[var(--bg-sidebar)] border border-[var(--border-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center px-8 py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] flex items-center justify-center mb-5">
                  <IconCheck size={20} strokeWidth={2} />
                </div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Track submitted</h2>
                <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                  It is in. You will get written feedback whatever happens. Track it from Submissions.
                </p>
                <div className="mt-8 flex gap-2 justify-center">
                  <Link href="/dashboard" className={btn('primary', 'md')}>
                    See my submissions
                  </Link>
                  <button type="button" onClick={() => setOpen(false)} className={btn('secondary', 'md')}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6 pb-5 border-b border-[var(--border-base)] flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Submit your track</h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-muted)] truncate">{projectName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={uploading}
                    aria-label="Close"
                    className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] disabled:opacity-40"
                  >
                    <IconClose size={16} />
                  </button>
                </div>

                <div className="px-6 py-6 flex flex-col gap-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/wave,audio/x-wav,.mp3,.wav"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {pendingFile ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                      <span className="w-10 h-10 rounded-xl bg-[var(--signal-soft)] text-[var(--signal)] flex items-center justify-center shrink-0">
                        <IconWaveform size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] truncate">{pendingFile.name}</span>
                        <span className="block text-[12px] text-[var(--text-dim)]">
                          {(pendingFile.size / 1_048_576).toFixed(1)} MB
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={btn('ghost', 'sm', 'px-3')}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full rounded-2xl border border-dashed px-6 py-9 flex flex-col items-center gap-3 transition-colors ${
                        dragging
                          ? 'border-[var(--signal)] bg-[var(--signal-soft)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <span className="w-11 h-11 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-secondary)]">
                        <IconUpload size={17} />
                      </span>
                      <span className="text-[14px] font-medium">{dragging ? 'Drop it here' : 'Drop your track or choose a file'}</span>
                      <span className="text-[12px] text-[var(--text-dim)]">MP3 or WAV · up to {MAX_AUDIO_LABEL}</span>
                    </button>
                  )}

                  {pendingFile && (
                    <div>
                      <label htmlFor="submission-track-name" className={fieldLabel}>
                        Track name
                      </label>
                      <input
                        id="submission-track-name"
                        type="text"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  {alreadySubmitted && (
                    <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-[13px] text-[var(--text-muted)] leading-relaxed">
                      You have already submitted to this brief. This one is reviewed as a separate entry.
                    </p>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer text-[13px] text-[var(--text-muted)] leading-relaxed">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--signal)]"
                    />
                    <span>
                      {isAdmin
                        ? 'Submitting as Thought Collective. No credit used.'
                        : `This uses 1 of your ${submissionCredits} free ${submissionCredits === 1 ? 'submission' : 'submissions'}. It goes privately to Thought Collective.`}
                    </span>
                  </label>

                  {!hasCredit && (
                    <p className="rounded-xl bg-[var(--warning-soft)] px-4 py-3 text-[13px] text-[var(--warning)] leading-relaxed">
                      You have used your free submissions for now. A new one arrives every week, and unused ones stack up, so check back in a few days.
                    </p>
                  )}

                  {error && (
                    <p role="alert" className="text-[13px] text-[var(--danger)] leading-relaxed">
                      {error}
                    </p>
                  )}

                  {uploading && (
                    <div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border-card)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--signal)] transition-[width] duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[12px] text-[var(--text-dim)] tabular-nums">
                        {progress < 100 ? `Uploading ${progress}%` : 'Finishing up…'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || uploading}
                    className={btn('accent', 'lg', 'flex-1')}
                  >
                    {uploading ? (progress < 100 ? `Uploading ${progress}%` : 'Finishing…') : 'Submit track'}
                  </button>
                  <button type="button" onClick={handleClose} disabled={uploading} className={btn('secondary', 'lg')}>
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
