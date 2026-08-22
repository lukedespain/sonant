import Link from 'next/link';

const DISCO_CATALOG_URL = 'https://sonant.disco.ac/cat/152887908';

const faqs = [
  {
    q: 'What is Sonant?',
    a: 'Sonant is a platform for composers who want to write music for brands, film, and games. Generate briefs written to real sync spec, practice writing to them, submit your best work, and get written feedback. Tracks that fit the catalog get placed and pitched to buyers on a 70/30 split, non-exclusive.',
  },
  {
    q: 'What\'s the difference between a catalog brief and a practice brief?',
    a: 'Catalog briefs are the ones you submit to, to try to get into the catalog. There are two kinds: Sonant briefs, curated by the team around what the catalog needs, and community briefs, written by composers. Practice briefs are ones you generate yourself, private, just yours, so you can get reps writing to spec before you submit.',
  },
  {
    q: 'How do I submit music to a catalog brief?',
    a: 'Open any catalog brief, read it carefully, write your track, and submit from the brief page. Each submission costs one credit. You\'ll get written feedback regardless of outcome.',
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
    a: 'The badge is automatic. Once three of your catalog submissions are accepted, you earn it. It marks you as catalog-ready. Badge holders will get first access when client briefs go live.',
  },
  {
    q: 'What are client briefs?',
    a: 'Client briefs are real paid jobs from brands, studios, and supervisors in the Sonant network. They stay in a closed network, they pay, and they come with a quick deadline. Three catalog placements earn you access.',
  },
  {
    q: 'What is the Brief Generator?',
    a: 'The generator builds a full creative brief from the project type (brand, film, or game), category, mood, and genre you select. It produces the same kind of direction a supervisor would send: scene, emotional arc, instrumentation, reference points. Use it to practice, then submit your best work to a catalog brief.',
  },
  {
    q: 'What is a 1:1 feedback session?',
    a: 'A focused 45-minute session. We listen to your track together, compare it against the brief you wrote to, and give you specific notes in real time. Good before a catalog submission, after written feedback, or when a mix has been open too long. Sessions are $50.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'You can generate briefs without an account. An account is required to save briefs, submit to the catalog, or book a session. Creating one is free, and every account includes one catalog submission credit each month.',
  },
  {
    q: 'Who is Sonant for?',
    a: 'Composers who want to get better at writing to spec and build a catalog worth pitching, whether you\'re new to sync or already working. The briefs are the practice material. The catalog is the path to getting the music in front of people who need it.',
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
          Everything you need to know about how Sonant works, what the briefs are for, and how submissions and feedback sessions work.
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
              Browse the active catalog briefs, find one that fits, and write your track. Every submission gets written feedback.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Link
              href="/browse"
              className="px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Browse Catalog
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
