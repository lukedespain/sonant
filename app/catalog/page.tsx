import Link from 'next/link';

const DISCO_CATALOG_URL = 'https://sonant.disco.ac/cat/152887908';

export default function CatalogPage() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div className="mb-20">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ The Catalog
          </div>

          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6 max-w-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            This is where your track{' '}
            <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>ends up.</span>
          </h1>

          <p className="text-base text-[var(--text-tertiary)] mb-3 max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Tracks accepted from active Sonant briefs join the Sonant catalog on Disco, a platform built for music supervisors and sync licensing. Your music, in front of real buyers.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Every submission is individually reviewed. The bar is the point.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={DISCO_CATALOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ↗ Browse the Catalog
            </a>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              ◆ View This Month&apos;s Briefs
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="border-t border-[var(--border-base)] pt-16">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ How tracks get in
          </div>
          <div className="space-y-0 border-t border-[var(--border-base)]">
            {[
              {
                n: '01',
                title: 'Write to a Sonant brief',
                body: 'Sonant publishes active briefs for tracks we need in the catalog. Brand, Film, Game. Read the brief like a client sent it. Write your track to spec.',
              },
              {
                n: '02',
                title: 'Submit privately',
                body: 'Submissions go directly to the Sonant team and are not publicly listed. Every submission gets reviewed and receives written feedback.',
              },
              {
                n: '03',
                title: 'Accepted tracks get placed',
                body: 'Strong tracks are added to the catalog and actively pitched to brands, agencies, studios, and music supervisors. You keep 70% of any sync fee. Non-exclusive: your music stays yours.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="border-b border-[var(--border-base)] py-8 grid grid-cols-1 md:grid-cols-[80px_1fr_2fr] gap-6">
                <div
                  className="text-3xl leading-none"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, color: 'var(--border-hover)' }}
                >
                  {n}
                </div>
                <h3
                  className="text-base text-[var(--text-primary)] leading-snug"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm text-[var(--text-muted)] leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
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
