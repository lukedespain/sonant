'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_AUDIO_BYTES, MAX_AUDIO_LABEL, isMp3, tooLargeMessage } from '@/lib/audio-upload';
import { UploadRequestError, postJson, putToSignedUrl } from '@/lib/upload-client';

/**
 * What one attempt at an upload is holding. Reusing the ticket on a retry means
 * a lost response is confirmed against the same object rather than uploading a
 * second copy and leaving two rows pointing at one brief's playlist.
 */
type Ticket = {
  storagePath: string;
  signedUrl: string;
  contentType: string;
  /** Identifies the file this ticket was issued for. */
  fileKey: string;
  uploaded: boolean;
};

type Props = {
  briefId: string;
  briefName: string;
  currentUserName?: string;
  triggerClassName?: string;
  triggerLabel?: string;
};

export default function UploadTrackModal({
  briefId,
  briefName,
  currentUserName = '',
  triggerClassName,
  triggerLabel = '↑ Upload MP3',
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<Ticket | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleOpen() {
    setOpen(true);
    setPendingFile(null);
    setTrackName('');
    setIsPublic(true);
    setError(null);
    setProgress(0);
    setDone(false);
    ticketRef.current = null;
  }

  function handleClose() {
    if (uploading) return;
    setOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!isMp3(file.name, file.type)) {
      setError('Uploads need to be MP3.');
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(tooLargeMessage(file.size, 'MP3'));
      return;
    }
    setError(null);
    setPendingFile(file);
    setTrackName(file.name.replace(/\.[^.]+$/, ''));
  }

  async function handleUpload() {
    if (!pendingFile || !trackName.trim()) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    const name = trackName.trim() || pendingFile.name;
    const fileKey = `${pendingFile.name}:${pendingFile.size}:${pendingFile.lastModified}`;

    if (ticketRef.current && ticketRef.current.fileKey !== fileKey) ticketRef.current = null;

    try {
      // The audio goes straight to storage; only these small JSON calls hit the
      // server, which is what keeps large files from being rejected in transit.
      if (!ticketRef.current) {
        const minted = await postJson<{
          storagePath: string;
          signedUrl: string;
          contentType: string;
        }>('/api/community-tracks/upload-url', {
          briefId,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          contentType: pendingFile.type,
        });
        ticketRef.current = { ...minted, fileKey, uploaded: false };
      }
      const ticket = ticketRef.current;

      if (ticket.uploaded) {
        setProgress(100);
      } else {
        try {
          await putToSignedUrl(ticket.signedUrl, pendingFile, ticket.contentType, setProgress);
        } catch (uploadError) {
          // The signed URL is single use and we cannot tell from here whether
          // it was consumed, so start the next attempt from a fresh one.
          ticketRef.current = null;
          throw uploadError;
        }
        ticket.uploaded = true;
      }

      await postJson('/api/community-tracks/upload', {
        briefId,
        storagePath: ticket.storagePath,
        trackName: name,
        isPublic,
      });

      ticketRef.current = null;
      setDone(true);
      router.refresh();
    } catch (err) {
      if (err instanceof UploadRequestError && err.uploadGone) ticketRef.current = null;
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
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
                  Track uploaded.
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {isPublic
                    ? 'It is on this brief\'s playlist and on your profile.'
                    : 'It is private. Only you can see it on this brief and on your profile.'}
                </p>
                <button
                  type="button"
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
                  ◆ Upload Track
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
                      Track File
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mp3,audio/mpeg,.mp3"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {pendingFile ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)] truncate flex-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {pendingFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors shrink-0"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors text-xs tracking-[0.2em] uppercase text-center"
                        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                      >
                        Choose MP3
                      </button>
                    )}
                    <p className="text-[9px] text-[var(--text-dimmer)] mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Free · MP3 · max {MAX_AUDIO_LABEL}
                    </p>
                  </div>

                  {pendingFile && (
                    <div>
                      <label
                        htmlFor="upload-track-name"
                        className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Track Name
                      </label>
                      <input
                        id="upload-track-name"
                        type="text"
                        value={trackName}
                        onChange={(e) => setTrackName(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                      />
                    </div>
                  )}

                  {currentUserName && (
                    <div>
                      <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Uploaded By
                      </label>
                      <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {currentUserName}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Visibility
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPublic((v) => !v)}
                      className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] hover:text-[#E85D2F] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {isPublic ? 'Public · on the playlist and your profile' : 'Private · only you can see this'}
                    </button>
                  </div>
                </div>

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
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !pendingFile || !trackName.trim()}
                    className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                  >
                    {uploading
                      ? progress < 100
                        ? `◆ Uploading ${progress}%`
                        : '◆ Finishing…'
                      : '◆ Upload'}
                  </button>
                  <button
                    type="button"
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
