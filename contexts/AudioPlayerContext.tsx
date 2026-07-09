'use client';

import { createContext, useContext, useRef, useState, ReactNode } from 'react';

export interface TrackInfo {
  url: string;
  fileName: string;
  briefId: string;
  briefName: string;
}

interface ContextValue {
  track: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (t: TrackInfo) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
}

const Ctx = createContext<ContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function play(newTrack: TrackInfo) {
    const el = ref.current;
    if (!el) return;
    if (track?.url !== newTrack.url) {
      el.src = newTrack.url;
      setTrack(newTrack);
      setCurrentTime(0);
      setDuration(0);
    }
    el.play().catch(() => {});
    setIsPlaying(true);
  }

  function pause() {
    ref.current?.pause();
    setIsPlaying(false);
  }

  function toggle() {
    if (isPlaying) {
      pause();
    } else {
      ref.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function seek(time: number) {
    if (ref.current) ref.current.currentTime = time;
    setCurrentTime(time);
  }

  return (
    <Ctx.Provider value={{ track, isPlaying, currentTime, duration, play, pause, toggle, seek }}>
      <audio
        ref={ref}
        onTimeUpdate={() => setCurrentTime(ref.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      {children}
    </Ctx.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
