import Link from 'next/link';

const PILLARS = [
  {
    n: '01',
    title: 'The Generator',
    body: 'The brief generator is for practice on demand. You pick type, mood, and genre, and it writes a spec the way a supervisor would.',
    href: '/generator',
  },
  {
    n: '02',
    title: 'The Library',
    body: 'Briefs you write to. Practice briefs anyone can take, and paid opportunities for brands, films and games once you have three placements.',
    href: '/browse',
  },
  {
    n: '03',
    title: 'The Catalog',
    body: 'Your submitted work, with written notes and placements. The goal, over time, is a catalog worth pitching.',
    href: '/submissions',
  },
] as const;

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function ComposerPath() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-8">
      {PILLARS.map((step) => (
        <Link
          key={step.n}
          href={step.href}
          className="group border-t border-[var(--border-base)] pt-6 block hover:border-[#E85D2F] transition-colors"
        >
          <div
            className="text-4xl leading-none text-[var(--text-dimmer)] mb-5"
            style={{ ...serif, fontWeight: 300 }}
          >
            {step.n}
          </div>
          <div
            className="text-xl mb-3 inline-flex items-center gap-2 text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors"
            style={{ ...serif, fontWeight: 400 }}
          >
            {step.title}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-[#E85D2F]"
            >
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed" style={sans}>
            {step.body}
          </p>
        </Link>
      ))}
    </div>
  );
}
