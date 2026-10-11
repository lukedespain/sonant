import Link from 'next/link';
import Image from 'next/image';
import ComposerPath from '@/components/ComposerPath';
import AboutQuestions from '@/components/AboutQuestions';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

const GUMROAD_URL = 'https://sonant.gumroad.com/l/royalties';

export default function HomePage() {
  return (
    <div className="flex-1">

      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-5"
          style={mono}
        >
          Welcome Composers
        </div>
        <h1
          className="tracking-tight leading-[0.95] mb-8 max-w-3xl"
          style={{
            ...serif,
            fontWeight: 300,
            fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
          }}
        >
          Learn to compose music <span className="italic text-[#E85D2F]">worth pitching.</span>
        </h1>
        <p
          className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl"
          style={sans}
        >
          Sonant is a platform for sync composers to practice writing to spec for brands, films and games.
        </p>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
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
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="max-w-xl">
            <div className="text-[9px] tracking-[0.35em] uppercase text-[#E85D2F] mb-5" style={mono}>
              ◆ The Sonant guide
            </div>
            <h2
              className="text-3xl md:text-4xl tracking-tight leading-[1.1] mb-4"
              style={{ ...serif, fontWeight: 300 }}
            >
              Every royalty <span className="italic">you&apos;re owed.</span>
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8" style={sans}>
              A placement pays out in more places than most composers collect from. The guide walks you through PRO, MRO, and the rest, with a catalog tracker and split sheet template.
            </p>
            <a
              href={GUMROAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity"
              style={mono}
            >
              Get the guide · $35 →
            </a>
          </div>
          <a
            href={GUMROAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block shrink-0"
            aria-label="Get the royalties guide"
          >
            <Image
              src="/royalties-thumbnail.png"
              alt="Every Royalty You're Owed guide cover"
              width={220}
              height={220}
              className="border border-[var(--border-card)]"
              style={{ borderRadius: '2px' }}
            />
          </a>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="max-w-xl">
            <h2
              className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-8"
              style={{ ...serif, fontWeight: 300 }}
            >
              Ready to <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>compose?</span>
            </h2>
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/generator"
                className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
              >
                ◆ Open the Generator
              </Link>
              <Link
                href="/briefs"
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                style={mono}
              >
                Open Briefs →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
