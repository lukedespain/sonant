'use client';

import Link from 'next/link';
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
    <div className="mt-10 no-print">
      <div
        className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        ◆ Playlist
      </div>
      <p
        className="text-sm text-[var(--text-muted)] mb-5 max-w-xl leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Uploads attached to this brief. Public tracks show here and on the composer&apos;s profile. Private stays only on yours.
      </p>

      {tracks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
                  isFeatured ? 'border-[#E85D2F]/50' : 'border-[var(--border-card)]'
                }`}
                style={{ borderRadius: '2px' }}
              >
                <button
                  onClick={() => handlePlay(track)}
                  className={`w-7 h-7 flex items-center justify-center shrink-0 transition-colors ${
                    isCurrentlyPlaying
                      ? 'bg-[#E85D2F] text-[#0A0908]'
                      : 'bg-[#0A0908] text-[#E85D2F]'
                  }`}
                  style={{ borderRadius: '2px' }}
                  aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                >
                  <PlayPauseIcon playing={isCurrentlyPlaying} size={10} />
                </button>

                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs text-[var(--text-secondary)] truncate block"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {track.file_name}
                    {track.isOwner && !track.is_public && (
                      <span className="text-[var(--text-dimmer)]"> · private</span>
                    )}
                  </span>
                  <Link
                    href={`/profile/${track.uploader_id}`}
                    className="text-[10px] text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors truncate block"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {track.uploader_name}
                    {isFeatured && (
                      <span className="text-[#E85D2F] ml-2">· featured</span>
                    )}
                  </Link>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {track.isOwner && (
                    <button
                      type="button"
                      onClick={() => handleVisibility(track.id, !track.is_public)}
                      disabled={isPending}
                      className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors disabled:opacity-40"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
    </div>
  );
}
