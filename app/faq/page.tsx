import Link from 'next/link';

const DISCO_CATALOG_URL = 'https://sonant.disco.ac/cat/152887908';

const faqs = [
  {
    q: 'What is Sonant?',
    a: 'Sonant is a platform for sync composers to practice writing to spec for brands, films and games. Three pages: the Generator, the Library, and the Catalog. The point is to build a catalog worth pitching. Tracks that get placed are pitched to buyers on a 70/30 split, non-exclusive.',
  },
  {
    q: 'What is the Generator?',
    a: 'A brief builder for practice on demand. You pick type, category, mood, and genre, and it writes a full creative brief the way a supervisor would: scene, emotional arc, instrumentation, reference points. No client required. Just reps writing to spec.',
  },
  {
    q: 'What is the Library?',
    a: 'The briefs you write to. Practice briefs anyone can take — curated by Sonant, or written by other composers — and paid opportunities for brands, films and games once you have three catalog placements. Paid jobs stay behind the verified badge.',
  },
  {
    q: 'What is the Catalog?',
    a: 'Your submitted work over time: tracks, written notes, and placements. Strong tracks get placed and pitched. Three placements unlock paid briefs in the Library. The catalog is the thing you are building.',
  },
  {
    q: 'How do I submit music?',
    a: 'Open a brief in the Library, write your track to that spec, and submit from the brief page. Each submission costs one credit and goes into your Catalog. You get written feedback regardless of outcome.',
  },
  {
    q: 'What happens after I submit?',
    a: 'Every submission is reviewed and gets a written response. If your track is accepted, it is added to the catalog and pitched. If not, you\'ll get specific notes on why. You keep full ownership either way.',
  },
  {
    q: 'What are the terms if my track gets placed?',
    a: 'You own your music. Sonant is non-exclusive. If Sonant brokers a placement, you keep 70% of the sync fee. You\'re free to pitch the same track anywhere else.',
  },
  {
    q: 'How do I earn the Sonant badge?',
    a: 'The badge is automatic. Once three of your Catalog submissions are accepted, you earn it. It marks you as catalog-ready, and unlocks paid opportunities in the Library.',
  },
  {
    q: 'What are paid opportunities?',
    a: 'Real paid jobs from brands, studios, and supervisors in the Sonant network. They live in the Library under Paid. They stay in a closed network, they pay, and they come with a quick deadline. Three catalog placements earn you access.',
  },
  {
    q: 'What kind of feedback do I get?',
    a: 'Every Catalog submission gets written notes, whether the track is accepted or not. The notes are tied to the brief you wrote to. There are no live coaching calls on Sonant.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'You can use the Generator without an account. An account is required to save briefs or submit from the Library. Creating one is free, and every account includes one submission credit each month. Extra credits are $10 each from your profile.',
  },
  {
    q: 'Who is Sonant for?',
    a: 'Composers who want to get better at writing to spec and build a catalog worth pitching, whether you\'re new to sync or already working. The Generator is the practice tool. The Library is the briefs. The Catalog is the body of work you pitch.',
  },
];

export default function FAQPage() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ FAQ
        </div>
        <h1
          className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-5 max-w-2xl"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          How Sonant <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>works.</span>
        </h1>
        <p
          className="text-base text-[var(--text-tertiary)] mb-16 max-w-xl leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Everything you need to know about the Generator, the Library, and the Catalog.
        </p>

        <div className="space-y-0 border-t border-[var(--border-base)]">
          {faqs.map(({ q, a }) => (
            <div
              key={q}
              className="border-b border-[var(--border-base)] py-8 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6"
            >
              <h2
                className="text-base text-[var(--text-primary)] leading-snug"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
              >
                {q}
              </h2>
              <p
                className="text-sm text-[var(--text-muted)] leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-16 border border-[var(--border-card)] bg-[var(--bg-card)] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ borderRadius: '2px' }}
        >
          <div>
            <div
              className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ Ready to start?
            </div>
            <p
              className="text-base text-[var(--text-secondary)] leading-relaxed max-w-md"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Browse the Library, find a brief that fits, and write your track. Every submission gets written feedback.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Link
              href="/browse"
              className="px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Open the Library
            </Link>
            <a
              href={DISCO_CATALOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Listen to the Music
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
