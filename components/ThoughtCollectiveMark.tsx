export default function ThoughtCollectiveMark({
  className,
  size = 20,
  invert = false,
}: {
  className?: string;
  size?: number;
  invert?: boolean;
}) {
  return (
    <img
      src="/brand/thought-collective-mark.png"
      alt=""
      width={size}
      height={size}
      className={`${invert ? '' : 'tc-mark'} ${className ?? ''}`.trim()}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        filter: invert ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  );
}
