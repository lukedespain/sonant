import Link from 'next/link';

export default function CatalogPage() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div className="mb-20">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Catalog
          </div>

          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-5 max-w-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            The catalog is <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>taking shape</span>.
          </h1>

          <p className="text-base text-[var(--text-tertiary)] mb-3 max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            A curated library of music written to Sonant briefs. Every track individually reviewed. The bar is the point.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            First accepted tracks are in review now.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-card)] bg-[var(--bg-card)]" style={{ borderRadius: '2px' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E85D2F] animate-pulse" />
              <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Building
              </span>
            </div>
            <Link
              href="/submissions"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ How Submissions Work
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Generate a Brief
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
