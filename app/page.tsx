import Link from 'next/link';
import ComposerPath from '@/components/ComposerPath';
import AboutQuestions from '@/components/AboutQuestions';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function HomePage() {
  return (
    <div className="flex-1">

      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-5"
          style={mono}
        >
          About Sonant
        </div>
        <h1
          className="tracking-tight leading-[0.95] mb-8 max-w-2xl"
          style={{
            ...serif,
            fontWeight: 300,
            fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
          }}
        >
          A practice room for <span className="italic text-[#E85D2F]">sync composers.</span>
        </h1>
        <p
          className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl"
          style={sans}
        >
          Generate briefs to practice writing to spec. Get written and live feedback to hone your craft. Place tracks in the catalog, and after enough practice, earn access to real paid briefs.
        </p>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-12 max-w-lg"
            style={{ ...serif, fontWeight: 300 }}
          >
            How it <span className="italic">works.</span>
          </h2>
          <ComposerPath />
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-10"
            style={{ ...serif, fontWeight: 300 }}
          >
            Questions.
          </h2>
          <AboutQuestions />
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="max-w-xl">
            <h2
              className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-8"
              style={{ ...serif, fontWeight: 300 }}
            >
              Ready to <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>start?</span>
            </h2>
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/generator"
                className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
              >
                ◆ Generate a Brief
              </Link>
              <Link
                href="/browse"
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                style={mono}
              >
                Browse catalog briefs →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
