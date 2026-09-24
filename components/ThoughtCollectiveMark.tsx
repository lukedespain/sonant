export default function ThoughtCollectiveMark({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        backgroundColor: 'currentColor',
        WebkitMaskImage: 'url(/brand/thought-collective-mark.png)',
        maskImage: 'url(/brand/thought-collective-mark.png)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
