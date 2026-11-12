import Link from 'next/link';
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark';

const GUMROAD_URL = 'https://sonant.gumroad.com/l/royalties';

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Composers',
    links: [
      { label: 'Generator', href: '/generator' },
      { label: 'Briefs', href: '/briefs' },
      { label: 'Catalogs', href: '/catalogs' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Royalties guide', href: GUMROAD_URL, external: true },
    ],
  },
  {
    title: 'Contact',
    links: [{ label: 'hello@sonant.ac', href: 'mailto:hello@sonant.ac' }],
  },
];

export default function Footer() {
  return (
    <footer className="no-print border-t border-[var(--border-base)] mt-auto">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-14 grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        <div className="col-span-2 md:col-span-1 max-w-xs">
          <p className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.01em]">
            <ThoughtCollectiveMark size={20} />
            Thought Collective
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            Practice writing to spec. Get written feedback. Get your music into catalogs.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="label text-[var(--text-dimmer)] mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors break-all"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-5 md:px-10 pb-10 text-xs text-[var(--text-dimmer)]">
        © {new Date().getFullYear()} Sonant
      </div>
    </footer>
  );
}
