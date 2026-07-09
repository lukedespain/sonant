'use client';

import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

export default function FeaturedTrackPlayer({
  url,
  fileName,
  briefId,
  briefName,
}: {
  url: string;
  fileName?: string;
  briefId: string;
  briefName: string;
}) {
  const { track, isPlaying, play, pause } = useAudioPlayer();
  const isActive = track?.url === url;
  const isCurrentlyPlaying = isActive && isPlaying;

  function handleToggle() {
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({ url, fileName: fileName ?? 'Featured Track', briefId, briefName });
    }
  }

  return (
    <div
      className="mb-6 no-print flex items-center gap-3 border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3"
      style={{ borderRadius: '2px' }}
    >
      <button
        onClick={handleToggle}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
          isCurrentlyPlaying
            ? 'bg-[#E85D2F] text-[var(--bg-base)]'
            : 'bg-[#E85D2F]/20 text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[var(--bg-base)]'
        }`}
        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play featured track'}
      >
        {isCurrentlyPlaying ? '■' : '▶'}
      </button>

      <div className="min-w-0">
        <div
          className="text-[9px] tracking-[0.3em] uppercase text-[#E85D2F] mb-0.5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isCurrentlyPlaying ? '◆ Currently Playing' : '◆ Featured Track'}
        </div>
        {fileName && (
          <div
            className="text-xs text-[var(--text-secondary)] truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {fileName}
          </div>
        )}
      </div>
    </div>
  );
}
