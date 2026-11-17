'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * second submission. Minting a fresh one would look like a second track.
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
  /** Project uploads are free versions for a client project, not catalogue submissions. */
  mode?: 'catalog' | 'project';
};

export default function SubmitTrackModal({
  briefId,
  projectName,
  alreadySubmitted,
  triggerClassName,
  triggerLabel = 'Submit track',
  mode = 'catalog',
}: Props) {
  const isProject = mode === 'project';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<Ticket | null>(null);

  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setOpen(true);
    setPendingFile(null);
    setTrackName('');
    setChecks({});
    setStep(1);
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

  const agreements: { id: string; label: string }[] = isProject
    ? [
        { id: 'original', label: 'This is my own original work, written for this project.' },
        { id: 'private', label: 'I will keep the brief, the references, and this project private.' },
      ]
    : [
        { id: 'original', label: 'Original music, start to finish. Not a cover.' },
        { id: 'human', label: 'Human-made. No AI-generated music, stems, or vocals.' },
        { id: 'private', label: 'It goes privately to Thought Collective. You will hear from us if it is picked.' },
      ];
  const confirmed = agreements.every((a) => checks[a.id]);
  const trackReady = !!pendingFile && trackName.trim().length > 0;
  const canSubmit = trackReady && confirmed;
  const STEPS = ['Track', 'Confirm', 'Review'] as const;

  return (
    <>
      <button type="button" onClick={handleOpen} className={triggerClassName ?? btn('accent', 'md')}>
        {triggerLabel}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 bg-black/75 animate-fade"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={isProject ? 'Upload a version' : 'Submit your track'}
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-4 rounded-3xl border-2 border-dashed border-[var(--signal)]" aria-hidden />
          )}
          <div
            className="relative w-full sm:max-w-[500px] max-h-[92vh] flex flex-col bg-[var(--bg-sidebar)] border border-[var(--border-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-rise"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center px-8 py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] flex items-center justify-center mb-5">
                  <IconCheck size={20} strokeWidth={2} />
                </div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{isProject ? 'Version uploaded' : 'Track submitted'}</h2>
                <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                  {isProject
                    ? 'Our team has it. Notes come back in the project thread.'
                    : 'It is in. We will email you when there is a decision. Follow it in Submissions.'}
                </p>
                <div className="mt-8 flex gap-2 justify-center">
                  {!isProject && (
                    <Link href="/dashboard" className={btn('primary', 'md')}>
                      See my submissions
                    </Link>
                  )}
                  <button type="button" onClick={() => setOpen(false)} className={btn('secondary', 'md')}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 pt-6 pb-5 border-b border-[var(--border-base)] shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{isProject ? 'Upload a version' : 'Submit your track'}</h2>
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
                  <ol className="mt-5 flex items-center gap-2" aria-label="Steps">
                    {STEPS.map((label, i) => {
                      const n = (i + 1) as 1 | 2 | 3;
                      const doneStep = n < step;
                      const current = n === step;
                      return (
                        <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                              doneStep
                                ? 'bg-[var(--accent)] text-[#0A0A0A]'
                                : current
                                  ? 'bg-[var(--signal)] text-[#0A0A0A]'
                                  : 'border border-[var(--border-subtle)] text-[var(--text-dim)]'
                            }`}
                            aria-current={current ? 'step' : undefined}
                          >
                            {doneStep ? <IconCheck size={11} strokeWidth={2.2} /> : n}
                          </span>
                          <span className={`text-[13px] ${current ? 'text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>{label}</span>
                          {i < STEPS.length - 1 && <span className="flex-1 h-px bg-[var(--border-card)] mx-1" aria-hidden="true" />}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="px-6 py-6 flex flex-col gap-5 overflow-y-auto app-scroll">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/wave,audio/x-wav,.mp3,.wav"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {step === 1 && (
                    <>
                      {pendingFile ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                          <span className="w-10 h-10 rounded-xl bg-[var(--signal-soft)] text-[var(--signal)] flex items-center justify-center shrink-0">
                            <IconWaveform size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] truncate">{pendingFile.name}</span>
                            <span className="block text-[12px] text-[var(--text-dim)]">{(pendingFile.size / 1_048_576).toFixed(1)} MB</span>
                          </span>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className={btn('ghost', 'sm', 'px-3')}>
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full rounded-2xl border border-dashed px-6 py-10 flex flex-col items-center gap-3 transition-colors ${
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
                      {alreadySubmitted && !isProject && (
                        <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-[13px] text-[var(--text-muted)] leading-relaxed">
                          You have already submitted to this brief. This one is reviewed as a separate entry.
                        </p>
                      )}
                    </>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[14px] text-[var(--text-muted)] mb-1">A few things to confirm before it goes in.</p>
                      {agreements.map((a) => (
                        <label
                          key={a.id}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition-colors ${
                            checks[a.id]
                              ? 'border-[var(--border-hover)] bg-[var(--bg-card)]'
                              : 'border-[var(--border-card)] hover:border-[var(--border-subtle)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!checks[a.id]}
                            onChange={(e) => setChecks((c) => ({ ...c, [a.id]: e.target.checked }))}
                            className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--signal)]"
                          />
                          <span className="text-[14px] leading-relaxed">{a.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {step === 3 && pendingFile && (
                    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
                      <div className="p-5 flex items-center gap-4 bg-[radial-gradient(120%_160%_at_0%_0%,var(--signal-soft),transparent_60%)]">
                        <span className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--signal)] shrink-0">
                          <IconWaveform size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12px] text-[var(--text-dim)]">{isProject ? 'New version' : 'New submission'}</p>
                          <p className="text-[17px] font-semibold tracking-[-0.02em] truncate">{trackName.trim() || pendingFile.name}</p>
                        </div>
                      </div>
                      <dl className="divide-y divide-[var(--border-base)] border-t border-[var(--border-base)] text-[13px]">
                        {[
                          [isProject ? 'Project' : 'Brief', projectName],
                          ['File', `${pendingFile.name} · ${(pendingFile.size / 1_048_576).toFixed(1)} MB`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-3">
                            <dt className="text-[var(--text-muted)] shrink-0">{k}</dt>
                            <dd className="text-right truncate">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="text-[13px] text-[var(--danger)] leading-relaxed">
                      {error}
                    </p>
                  )}

                  {uploading && (
                    <div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border-card)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--signal)] transition-[width] duration-200" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-[12px] text-[var(--text-dim)] tabular-nums">
                        {progress < 100 ? `Uploading ${progress}%` : 'Finishing up…'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 pt-1 flex gap-2 shrink-0">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                      disabled={uploading}
                      className={btn('secondary', 'lg')}
                    >
                      Back
                    </button>
                  ) : (
                    <button type="button" onClick={handleClose} className={btn('secondary', 'lg')}>
                      Cancel
                    </button>
                  )}
                  {step === 1 && (
                    <button type="button" onClick={() => setStep(2)} disabled={!trackReady} className={btn('primary', 'lg', 'flex-1')}>
                      Continue
                    </button>
                  )}
                  {step === 2 && (
                    <button type="button" onClick={() => setStep(3)} disabled={!confirmed} className={btn('primary', 'lg', 'flex-1')}>
                      Review
                    </button>
                  )}
                  {step === 3 && (
                    <button type="button" onClick={handleSubmit} disabled={!canSubmit || uploading} className={btn('accent', 'lg', 'flex-1')}>
                      {uploading ? (progress < 100 ? `Uploading ${progress}%` : 'Finishing…') : isProject ? 'Upload version' : 'Submit track'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
