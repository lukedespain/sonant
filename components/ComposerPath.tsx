import Link from 'next/link';

const STEPS = [
  {
    n: '01',
    title: 'Generate',
    body: 'Pick the genres, moods, and tags you actually want to write to. You get an industry-standard brief that feels like it was made for you.',
    href: '/generator',
  },
  {
    n: '02',
    title: 'Practice',
    body: 'Treat it like a real brief. Write as close as you can, at the best quality you can, because you\'re building a catalog worth pitching.',
    href: '/browse',
  },
  {
    n: '03',
    title: 'Submit',
    body: 'Send the track in. Every submission gets written feedback, and strong ones go in the catalog. Three placements unlock access to paid client briefs.',
    href: '/submissions',
  },
  {
    n: '04',
    title: 'Feedback',
    body: 'Book a session for live one-on-one notes. We listen against the brief, talk through tracks you\'ve submitted, and tell you what it would take to place.',
    href: '/sessions',
  },
] as const;

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function ComposerPath() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
      {STEPS.map((step) => (
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
