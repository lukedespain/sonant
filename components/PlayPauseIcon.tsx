export default function PlayPauseIcon({
  playing,
  size = 10,
}: {
  playing: boolean;
  size?: number;
}) {
  if (playing) {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="1.4" y="1.2" width="2.5" height="7.6" rx="0.4" />
        <rect x="6.1" y="1.2" width="2.5" height="7.6" rx="0.4" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M2.1 1.15v7.7L8.7 5 2.1 1.15z" />
    </svg>
  );
}
