import Link from 'next/link';

export default function CatalogPage() {
  return (
    <div className="pt-20 pb-12 flex-1 flex items-center justify-center">
      <div className="max-w-xl mx-auto px-6 md:px-10 text-center">

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Catalog
        </div>

        <h1 className="text-4xl md:text-5xl tracking-tight leading-tight mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          The catalog is <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>taking shape</span>.
        </h1>

        <p className="text-base md:text-lg text-[#A8A39A] mb-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          The Sonant Catalog is a curated library of music written to Sonant briefs.
          The first accepted tracks are being reviewed now.
        </p>

        <p className="text-base text-[#8A8680] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Every track in the catalog has been through individual review and answers
          a real brief. The bar is the point.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/submissions"
            className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ How Submissions Work
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Generate a Brief
          </Link>
        </div>

      </div>
    </div>
  );
}