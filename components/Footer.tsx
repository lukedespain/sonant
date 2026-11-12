import Link from 'next/link';
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';

const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: 'Briefs', href: '/briefs' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Main site ↗', href: THOUGHT_COLLECTIVE_SITE, external: true },
  { label: 'hello@thoughtcollective.com', href: 'mailto:hello@thoughtcollective.com', external: true },
];

export default function Footer() {
  return (
    <footer className="no-print mt-auto">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] py-14 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <p className="flex items-center gap-3 text-[17px] font-medium tracking-[-0.02em]">
            <ThoughtCollectiveMark size={22} />
            Thought Collective
          </p>
          <p className="mt-3 text-[15px] text-[var(--text-muted)] max-w-sm leading-relaxed">
            Briefs for composers from a London music and sound company.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
          {LINKS.map((link) => (
            <li key={link.label}>
              {link.external ? (
                <a href={link.href} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
