import Link from 'next/link';
import CatalogRequestForm from '@/components/CatalogRequestForm';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function CatalogPage() {
  return (
    <div className="pt-16 md:pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div className="mb-16 md:mb-20">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6 max-w-2xl" style={{ ...serif, fontWeight: 300 }}>
            The Sonant{' '}
            <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>Catalog.</span>
          </h1>

          <p className="text-base text-[var(--text-tertiary)] mb-3 max-w-xl leading-relaxed" style={sans}>
            Music accepted from Sonant brief submissions, pitched to music supervisors, agencies, studios, and sync buyers.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-12 leading-relaxed" style={sans}>
            Every submission is reviewed. The bar is the point. Three accepted tracks earns the badge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl tracking-tight mb-4" style={{ ...serif, fontWeight: 300 }}>
                For <span className="italic">composers.</span>
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6" style={sans}>
                Write to an active catalog brief. Every submission gets written feedback. Accepted tracks are added here and pitched. You keep 70%.
              </p>
              <Link
                href="/browse"
                className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
              >
                ◆ View Active Briefs
              </Link>
              <div className="mt-4">
                <Link
                  href="/account"
                  className="text-[10px] tracking-[0.2em] uppercase hover:opacity-75 transition-opacity"
                  style={mono}
                >
                  <span className="text-[var(--text-dimmer)]">Already submitted? </span>
                  <span className="text-[var(--text-muted)] hover:text-[#E85D2F]">Check your dashboard →</span>
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-2xl tracking-tight mb-4" style={{ ...serif, fontWeight: 300 }}>
                For music <span className="italic">buyers.</span>
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6" style={sans}>
                The catalog is curated and access is by request. We&apos;ll be in touch within 1–2 business days.
              </p>
              <CatalogRequestForm />
              <div className="mt-4">
                <a
                  href="https://sonant.ac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-[0.2em] uppercase hover:opacity-75 transition-opacity"
                  style={mono}
                >
                  <span className="text-[var(--text-dimmer)]">Already have access? </span>
                  <span className="text-[var(--text-muted)] hover:text-[#E85D2F]">Browse the catalog →</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-base)] pt-16">
          <div className="space-y-0 border-t border-[var(--border-base)]">
            {[
              {
                n: '01',
                title: 'Write to a catalog brief',
                body: 'Sonant publishes active briefs for tracks the catalog needs. Brand, film, game. Read it like a client sent it. Write to spec.',
              },
              {
                n: '02',
                title: 'Submit privately',
                body: 'Submissions go to the Sonant team and are not listed publicly. Every one is reviewed and gets written feedback.',
              },
              {
                n: '03',
                title: 'Accepted tracks get placed',
                body: 'Strong tracks are added here and pitched. You keep 70% of any sync fee. Non-exclusive: the music stays yours. Three accepted submissions earns the badge.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="border-b border-[var(--border-base)] py-8 grid grid-cols-1 md:grid-cols-[80px_1fr_2fr] gap-6">
                <div
                  className="text-3xl leading-none text-[var(--text-dimmer)]"
                  style={{ ...serif, fontWeight: 300 }}
                >
                  {n}
                </div>
                <h3
                  className="text-base text-[var(--text-primary)] leading-snug"
                  style={{ ...serif, fontWeight: 400 }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm text-[var(--text-muted)] leading-relaxed"
                  style={sans}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
