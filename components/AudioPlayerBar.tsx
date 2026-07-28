'use client';

import Link from 'next/link';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useState } from 'react';

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayerBar() {
  const { track, isPlaying, currentTime, duration, volume, toggle, seek, setVolume } = useAudioPlayer();
  const [seeking, setSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  if (!track) return null;

  const displayTime = seeking ? seekVal : currentTime;
  const pct = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-card)] bg-[var(--bg-card)]"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 flex items-center gap-3 md:gap-4">
        {/* Play/pause */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-[#E85D2F] hover:bg-[#FF6E3D] text-[var(--bg-base)] flex items-center justify-center shrink-0 transition-colors"
          style={{ fontSize: '11px' }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '■' : '▶'}
        </button>

        {/* Track info + seekbar */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Top row: filename + brief link + time */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex items-baseline gap-2 overflow-hidden">
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {track.fileName}
              </span>
              <Link
                href={`/browse/${track.briefId}`}
                className="text-[9px] tracking-[0.2em] uppercase text-[#E85D2F] hover:underline shrink-0 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {track.briefName} →
              </Link>
            </div>
            <span className="text-[10px] text-[var(--text-dimmer)] shrink-0 tabular-nums">
              {fmt(displayTime)} / {fmt(duration)}
            </span>
          </div>

          {/* Seekbar */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={seeking ? seekVal : currentTime}
            onChange={(e) => {
              setSeeking(true);
              setSeekVal(Number(e.target.value));
            }}
            onMouseUp={(e) => {
              seek(Number((e.target as HTMLInputElement).value));
              setSeeking(false);
            }}
            onTouchEnd={(e) => {
              seek(Number((e.target as HTMLInputElement).value));
              setSeeking(false);
            }}
            className="sonant-seekbar w-full"
            style={{
              background: `linear-gradient(to right, #E85D2F ${pct}%, var(--border-subtle) ${pct}%)`,
            }}
          />
        </div>

        {/* Volume — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="text-[var(--text-dimmer)] hover:text-[var(--text-secondary)] transition-colors text-sm leading-none"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="sonant-seekbar"
            style={{
              width: '72px',
              background: `linear-gradient(to right, #E85D2F ${volume * 100}%, var(--border-subtle) ${volume * 100}%)`,
            }}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
