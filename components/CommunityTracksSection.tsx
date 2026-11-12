'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCommunityTrack, setFeaturedTrack, setTrackVisibility } from '@/app/briefs/actions';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import PlayPauseIcon from './PlayPauseIcon';

interface Track {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  canDelete: boolean;
  uploader_name: string;
  uploader_id: string;
  is_public: boolean;
  isOwner: boolean;
}

export default function CommunityTracksSection({
  briefId,
  briefName,
  tracks,
  isAdmin = false,
  featuredTrackId = null,
}: {
  briefId: string;
  briefName: string;
  tracks: Track[];
  isAdmin?: boolean;
  featuredTrackId?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featPending, startFeatTransition] = useTransition();
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();

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

  function handleVisibility(trackId: string, nextPublic: boolean) {
    startTransition(async () => {
      await setTrackVisibility(trackId, nextPublic);
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
    <div id="playlist" className="mt-10 no-print scroll-mt-28">
      <div
        className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)] mb-2"
        style={{ fontFamily: "var(--brand-mono)" }}
      >
        Playlist
      </div>
      <p
        className="text-sm text-[var(--text-muted)] mb-5 max-w-xl leading-relaxed"
        style={{ fontFamily: "var(--brand-sans)" }}
      >
        Uploads attached to this brief. Public tracks show here and on the composer&apos;s profile. Private stays only on yours.
      </p>

      {tracks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--brand-sans)" }}>
          No takes on this playlist yet. Use Upload above to add one.
        </p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => {
            const isFeatured = featuredTrackId === track.id;
            const isActiveTrack = activeTrack?.url === track.file_url;
            const isCurrentlyPlaying = isActiveTrack && isPlaying;
            return (
              <div
                key={track.id}
                className={`border bg-[var(--bg-card)] px-4 py-3 flex items-center gap-3 transition-colors ${
                  isFeatured ? 'border-[var(--accent)]/50' : 'border-[var(--border-card)]'
                }`}
                style={{ borderRadius: '2px' }}
              >
                <button
                  onClick={() => handlePlay(track)}
                  className={`w-7 h-7 flex items-center justify-center shrink-0 transition-colors ${
                    isCurrentlyPlaying
                      ? 'bg-[var(--accent)] text-[#0A0908]'
                      : 'bg-[#0A0908] text-[var(--accent)]'
                  }`}
                  style={{ borderRadius: '2px' }}
                  aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                >
                  <PlayPauseIcon playing={isCurrentlyPlaying} size={10} />
                </button>

                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs text-[var(--text-secondary)] truncate block"
                    style={{ fontFamily: "var(--brand-sans)" }}
                  >
                    {track.file_name}
                    {track.isOwner && !track.is_public && (
                      <span className="text-[var(--text-dimmer)]"> · private</span>
                    )}
                  </span>
                  <span
                    className="text-[10px] text-[var(--text-dimmer)] truncate block"
                    style={{ fontFamily: "var(--brand-mono)" }}
                  >
                    {track.uploader_name}
                    {isFeatured && (
                      <span className="text-[var(--accent)] ml-2">· featured</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {track.isOwner && (
                    <button
                      type="button"
                      onClick={() => handleVisibility(track.id, !track.is_public)}
                      disabled={isPending}
                      className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
                      style={{ fontFamily: "var(--brand-mono)" }}
                    >
                      {track.is_public ? 'Public' : 'Private'}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleFeature(track.id)}
                      disabled={featPending}
                      title={isFeatured ? 'Remove as featured track' : 'Set as featured track'}
                      className={`text-base leading-none transition-colors disabled:opacity-40 ${
                        isFeatured
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-dimmer)] hover:text-[var(--accent)]'
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
                      style={{ fontFamily: "var(--brand-mono)" }}
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
    </div>
  );
}
