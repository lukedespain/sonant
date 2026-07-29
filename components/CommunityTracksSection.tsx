'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCommunityTrack, setFeaturedTrack } from '@/app/briefs/actions';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface Track {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  canDelete: boolean;
  uploader_name: string;
}

export default function CommunityTracksSection({
  briefId,
  briefName,
  tracks,
  canUpload,
  isAdmin = false,
  featuredTrackId = null,
  currentUserName = '',
}: {
  briefId: string;
  briefName: string;
  tracks: Track[];
  canUpload: boolean;
  isAdmin?: boolean;
  featuredTrackId?: string | null;
  currentUserName?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [featPending, startFeatTransition] = useTransition();
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();

  // Upload modal state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [showModal, setShowModal] = useState(false);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Pre-fill track name from filename (strip extension)
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    setPendingFile(file);
    setTrackName(nameWithoutExt);
    setShowModal(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleModalCancel() {
    setShowModal(false);
    setPendingFile(null);
    setTrackName('');
    setUploadError(null);
  }

  async function handleModalSubmit() {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.set('file', pendingFile);
    body.set('briefId', briefId);
    body.set('trackName', trackName.trim() || pendingFile.name);

    const res = await fetch('/api/community-tracks/upload', { method: 'POST', body });
    setUploading(false);

    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const json = await res.json();
        msg = json.error ?? msg;
      } catch {
        if (res.status === 413) msg = 'File too large — convert to MP3 and try again.';
      }
      setUploadError(msg);
    } else {
      setShowModal(false);
      setPendingFile(null);
      setTrackName('');
      router.refresh();
    }
  }

  function handleDelete(trackId: string) {
    if (!confirm('Remove this track?')) return;
    startTransition(async () => {
      await deleteCommunityTrack(trackId);
      router.refresh();
    });
  }

  function handleFeature(trackId: string) {
    const isAlreadyFeatured = featuredTrackId === trackId;
    startFeatTransition(async () => {
      await setFeaturedTrack(briefId, isAlreadyFeatured ? null : trackId);
      router.refresh();
    });
  }

  function handlePlay(track: Track) {
    const isActiveTrack = activeTrack?.url === track.file_url;
    const isCurrentlyPlaying = isActiveTrack && isPlaying;
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({ url: track.file_url, fileName: track.file_name, briefId, briefName });
    }
  }

  return (
    <div className="mt-10 no-print">
      <div
        className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ◆ Community Tracks
      </div>

      {tracks.length === 0 ? (
        <p
          className="text-sm text-[var(--text-muted)] mb-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {canUpload ? 'Be the first to upload a track for this brief.' : 'No tracks uploaded yet.'}
        </p>
      ) : (
        <div className="space-y-2 mb-6">
          {tracks.map((track) => {
            const isFeatured = featuredTrackId === track.id;
            const isActiveTrack = activeTrack?.url === track.file_url;
            const isCurrentlyPlaying = isActiveTrack && isPlaying;
            return (
              <div
                key={track.id}
                className={`border bg-[var(--bg-card)] px-4 py-3 flex items-center gap-3 transition-colors ${
                  isFeatured ? 'border-[#E85D2F]/50' : 'border-[var(--border-card)]'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {/* Play button */}
                <button
                  onClick={() => handlePlay(track)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                    isCurrentlyPlaying
                      ? 'bg-[#E85D2F] text-[var(--bg-base)]'
                      : 'bg-[#E85D2F]/15 text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[var(--bg-base)]'
                  }`}
                  aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                >
                  {isCurrentlyPlaying ? '■' : '▶'}
                </button>

                {/* Track name + uploader */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs text-[var(--text-secondary)] truncate block"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {track.file_name}
                  </span>
                  <span
                    className="text-[10px] text-[var(--text-dimmer)] truncate block"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {track.uploader_name}
                    {isFeatured && (
                      <span className="text-[#E85D2F] ml-2">· featured</span>
                    )}
                  </span>
                </div>

                {/* Admin star + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => handleFeature(track.id)}
                      disabled={featPending}
                      title={isFeatured ? 'Remove as featured track' : 'Set as featured track'}
                      className={`text-base leading-none transition-colors disabled:opacity-40 ${
                        isFeatured
                          ? 'text-[#E85D2F]'
                          : 'text-[var(--text-dimmer)] hover:text-[#E85D2F]'
                      }`}
                    >
                      {isFeatured ? '★' : '☆'}
                    </button>
                  )}
                  {track.canDelete && (
                    <button
                      onClick={() => handleDelete(track.id)}
                      disabled={isPending}
                      className="text-[9px] tracking-[0.2em] uppercase text-[#9A8A86] hover:text-[#C5564A] transition-colors disabled:opacity-40"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/mpeg,audio/aac,audio/mp4"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              ◆ Upload Track
            </button>
            <span
              className="text-[10px] text-[var(--text-dimmer)]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              MP3 or AAC · max 50 MB
            </span>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-card)] p-8"
            style={{ borderRadius: '2px' }}
          >
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Upload Track
            </div>

            <div className="space-y-5">
              {/* Project (read-only) */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Project
                </label>
                <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {briefName}
                </p>
              </div>

              {/* Track name (editable) */}
              <div>
                <label
                  htmlFor="track-name-input"
                  className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Track Name
                </label>
                <input
                  id="track-name-input"
                  type="text"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                />
              </div>

              {/* Uploader name (read-only) */}
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

              {/* File */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  File
                </label>
                <p className="text-xs text-[var(--text-muted)] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {pendingFile.name}
                </p>
              </div>
            </div>

            {uploadError && (
              <p className="text-[10px] text-[#FF8B6B] mt-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                × {uploadError}
              </p>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleModalSubmit}
                disabled={uploading || !trackName.trim()}
                className="flex-1 px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                {uploading ? '◆ Uploading…' : '◆ Upload'}
              </button>
              <button
                onClick={handleModalCancel}
                disabled={uploading}
                className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors disabled:opacity-50"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
