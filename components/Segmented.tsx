import Link from 'next/link';

/** Pill tabs that navigate (server friendly). */
export default function Segmented({
  items,
  className = 'mb-6',
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
  className?: string;
}) {
  return (
    <nav className={`inline-flex items-center gap-1 p-1 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={`h-8 px-3.5 rounded-full text-[13px] whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            item.active
              ? 'bg-[var(--accent)] text-[#0A0A0A] font-medium'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && (
            <span
              className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center tabular-nums ${
                item.active ? 'bg-[#0A0A0A]/10' : 'bg-[var(--signal)] text-[#0A0A0A]'
              }`}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
