import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Every Royalty You're Owed, and How to Collect It | Sonant",
  description:
    'The complete setup guide for independent musicians who are tired of leaving money uncollected.',
};

const GUMROAD_URL = 'https://sonant.gumroad.com/l/royalties';

const eyebrowFont = { fontFamily: "'JetBrains Mono', monospace" } as const;
const bodyFont = { fontFamily: "'DM Sans', sans-serif" } as const;
const displayFont = { fontFamily: "'Fraunces', serif", fontWeight: 300 } as const;
const displayItalic = { fontFamily: "'Fraunces', serif", fontWeight: 300, fontStyle: 'italic' } as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5"
      style={eyebrowFont}
    >
      {children}
    </div>
  );
}

function CtaButton() {
  return (
    <a
      href={GUMROAD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-xs tracking-[0.2em] uppercase px-6 py-4 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
    >
      ◆ Get the Guide, $35
    </a>
  );
}

const WHAT_YOU_GET = [
  "The 30+ page guide (PDF) on how royalty money actually flows and how to collect what's yours.",
  'A step-by-step setup for your PRO, MRO, DPRO, and more.',
  'A catalog tracker template (Google Sheets) for the metadata of every track you own.',
  'A split sheet template (Google Docs) that generates a signed PDF when all parties agree.',
  'Lifetime free updates.',
];

export default function RoyaltiesPage() {
  return (
    <div className="pt-20 pb-12 flex-1">

      {/* Hero image — square thumbnail on mobile, landscape cover on desktop */}
      <div className="px-4 md:px-[15%] mb-12">
        <Image
          src="/royalties-thumbnail.png"
          alt="Every Royalty You're Owed, and How to Collect It. Sonant guide cover"
          width={2400}
          height={2400}
          className="w-full md:hidden"
          priority
        />
        <Image
          src="/royalties-cover.png"
          alt="Every Royalty You're Owed, and How to Collect It. Sonant guide cover"
          width={3840}
          height={2160}
          className="w-full hidden md:block"
          priority
        />
      </div>

      {/* CTA + body content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* Primary CTA */}
        <div className="text-center mb-24">
          <CtaButton />
        </div>

        {/* The Hook */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-20 max-w-2xl mx-auto text-center">
          <p
            className="text-xl md:text-2xl text-[var(--text-primary)] mb-7 leading-snug"
            style={displayItalic}
          >
            If your only royalty check comes from your distributor, you are leaving money on the table.
          </p>
          <p className="text-base text-[var(--text-tertiary)] mb-4 leading-relaxed" style={bodyFont}>
            DistroKid, TuneCore, LANDR. They only collect one stream of income for you. The other ~25% of the money you&apos;re owed is sitting in collection societies right now, unclaimed.
          </p>
          <p className="text-base text-[var(--text-tertiary)] mb-4 leading-relaxed" style={bodyFont}>
            Not because you did anything wrong. Because the system is fragmented by design, and no one shows independent artists how to plug into the rest of it.
          </p>
          <p className="text-base text-[var(--text-primary)] leading-relaxed" style={bodyFont}>
            This guide does.
          </p>
        </section>

        {/* What is this? */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-20 max-w-2xl mx-auto text-center">
          <Eyebrow>◆ What is this?</Eyebrow>
          <h2
            className="text-2xl md:text-3xl tracking-tight leading-snug mb-5 text-[var(--text-primary)]"
            style={displayFont}
          >
            Not a textbook. Not a glossary. A complete royalty collection system.
          </h2>
          <p className="text-base text-[var(--text-tertiary)] leading-relaxed" style={bodyFont}>
            You get the tracking sheets to organize your catalog, plus a step-by-step manual that shows you how to register your tracks, claim your missing money, and run the system yourself. Every step is shown on a real released track, Echo Bliss by tethermind, so you see exactly how it works.
          </p>
        </section>

        {/* What do I get? */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-20 max-w-2xl mx-auto text-center">
          <Eyebrow>◆ What do I get?</Eyebrow>
          <ul className="space-y-5 text-left">
            {WHAT_YOU_GET.map((item, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="text-[#E85D2F] shrink-0 mt-0.5" style={eyebrowFont}>
                  ◆
                </span>
                <span className="text-base text-[var(--text-tertiary)] leading-relaxed" style={bodyFont}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why should I care? */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-20 max-w-2xl mx-auto text-center">
          <Eyebrow>◆ Why should I care?</Eyebrow>
          <p
            className="text-xl md:text-2xl text-[var(--text-primary)] mb-7 leading-snug"
            style={displayItalic}
          >
            You already did the hard part. You wrote it, recorded it, released it.
          </p>
          <p className="text-base text-[var(--text-tertiary)] mb-4 leading-relaxed" style={bodyFont}>
            These royalties are not a bonus. They are money your music has already earned, sitting in collection societies with your name not attached to it. Some of it has deadlines. Neighboring rights and back-claims do not wait forever.
          </p>
          <p className="text-base text-[var(--text-tertiary)] leading-relaxed" style={bodyFont}>
            Setting this up takes an afternoon. Leaving it unset costs you on every release, forever.
          </p>
        </section>

        {/* Is this for me? */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-20 max-w-2xl mx-auto text-center">
          <Eyebrow>◆ Is this for me?</Eyebrow>
          <p className="text-base text-[var(--text-tertiary)] leading-relaxed" style={bodyFont}>
            This is for the independent musician who is releasing music seriously but handling the business side alone. If you have tracks out, or tracks coming, and a nagging sense that you are being underpaid, this guide closes that gap. It is not for established composers with a publisher already handling registration. It is for the rest of us.
          </p>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[var(--border-card)] pt-12 mb-4 max-w-2xl mx-auto text-center">
          <p className="text-base text-[var(--text-tertiary)] mb-8 leading-relaxed" style={bodyFont}>
            Set it up once and start getting paid for everything you&apos;re owed, on past and future releases.
          </p>
          <CtaButton />
        </section>

      </div>
    </div>
  );
}
