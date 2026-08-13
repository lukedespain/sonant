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
    title: 'Write',
    body: 'Treat it like a real brief. Write as close as you can, at the best quality you can, because you\'re building a catalog worth pitching.',
  },
  {
    n: '03',
    title: 'Submit',
    body: 'Submit the track you wrote to that brief. The team reviews it, sends written feedback, and if it\'s good enough, adds it to the catalog and pitches it.',
    href: '/browse',
  },
  {
    n: '04',
    title: 'Access',
    body: 'Real client briefs stay in a closed network. Three catalog placements earn you access, so we know what you\'re good at and which jobs to send you.',
  },
] as const;

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function ComposerPath() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
      {STEPS.map((step) => (
        <div key={step.n} className="border-t border-[var(--border-base)] pt-6">
          <div
            className="text-4xl leading-none text-[var(--text-dimmer)] mb-5"
            style={{ ...serif, fontWeight: 300 }}
          >
            {step.n}
          </div>
          {'href' in step ? (
            <Link
              href={step.href}
              className="text-xl mb-3 inline-flex items-center gap-2 text-[var(--text-primary)] hover:text-[#E85D2F] transition-colors"
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
            </Link>
          ) : (
            <div
              className="text-xl mb-3 text-[var(--text-primary)]"
              style={{ ...serif, fontWeight: 400 }}
            >
              {step.title}
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)] leading-relaxed" style={sans}>
            {step.body}
          </p>
        </div>
      ))}
    </div>
  );
}
