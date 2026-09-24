export default function ThoughtCollectiveMark({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M50 4.5 95.5 50 50 95.5 4.5 50 50 4.5Zm0 32.5 20.5 23.5h-41L50 37Z"
      />
    </svg>
  );
}
