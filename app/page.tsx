import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
const DISCO_CATALOG_URL = 'https://sonant.disco.ac/cat/152887908';

interface FeaturedBrief {
  id: string;
  generated_content: {
    codename?: string;
    project?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
  mode: string;
}

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Game',
};

export default async function LandingPage() {
  const admin = createAdminClient();

  // One brief per mode for the current round
  const roundBriefs = (
    await Promise.all(
      ['brand', 'film', 'games'].map((mode) =>
        admin
          .from('briefs')
          .select('id, mode, generated_content')
          .eq('user_id', ADMIN_USER_ID)
          .eq('mode', mode)
          .not('generated_content->imageUrl', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .returns<FeaturedBrief[]>()
          .then(({ data }) => data?.[0] ?? null)
      )
    )
  ).filter(Boolean) as FeaturedBrief[];

  return (
    <div className="flex-1">

      {/* ── Hero ── */}
      <section className="min-h-[88vh] flex flex-col justify-center max-w-6xl mx-auto px-6 md:px-10 pt-20 pb-16">
        <div
          className="text-[10px] tracking-[0.5em] uppercase text-[#E85D2F] mb-8"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Built for composers, by composers.
        </div>
        <h1
          className="tracking-tight leading-[0.95] mb-8"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 'clamp(3.5rem, 9vw, 7.5rem)',
          }}
        >
          Write to the brief.<br />
          <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>
            Build your catalog.
          </span>
        </h1>
        <p
          className="text-base md:text-lg text-[var(--text-tertiary)] mb-10 max-w-md leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Sonant gives composers professional-style briefs for brand, film, and game. Practice writing to spec, submit your tracks for catalog review, and get written feedback on every submission. Book a 1:1 session for live notes on how your track hits the brief.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <Link
            href="/browse"
            className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ See the Briefs
          </Link>
          <Link
            href="/generator"
            className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Generate your own →
          </Link>
        </div>
      </section>

      {/* ── Current Round ── */}
      {roundBriefs.length > 0 && (
        <section className="border-t border-[var(--border-base)]">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div
                  className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ◆ Active Briefs
                </div>
                <h2
                  className="text-3xl md:text-4xl tracking-tight leading-tight mb-4"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  Write to one of these.
                </h2>
                <p className="text-sm text-[var(--text-muted)] max-w-lg leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Sonant briefs are written by our team to professional sync spec — the same format used in real brand, film, and game music requests. Three categories: Brand (advertising & campaigns), Film (TV & trailers), Game (video games & interactive). Submit your track to any open brief. Every submission gets written feedback.
                </p>
              </div>
              <Link
                href="/browse"
                className="hidden md:block text-xs tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors shrink-0 mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                All briefs →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roundBriefs.map((brief) => {
                const codename = brief.generated_content?.codename ?? 'Untitled';
                const imageUrl = brief.generated_content?.imageUrl;
                const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
                return (
                  <Link
                    key={brief.id}
                    href={`/browse/${brief.id}`}
                    className="group block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F]/50 transition-all duration-300 overflow-hidden"
                    style={{ borderRadius: '2px' }}
                  >
                    {imageUrl && (
                      <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to bottom, transparent 35%, var(--bg-card) 100%)' }}
                        />
                      </div>
                    )}
                    <div className="px-6 pb-6 pt-4">
                      <p
                        className="text-2xl italic leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors mb-3"
                        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                      >
                        {codename}
                      </p>
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] group-hover:text-[#E85D2F]/60 transition-colors"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {modeLabel} Brief →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div
            className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-14"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ How it works
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                n: '01',
                title: 'Read the brief',
                body: 'Sonant briefs are written to real sync industry spec — the same format a music supervisor sends for brand, film, and game projects. Mood, tempo, instrumentation, references. Read it like a client sent it.',
              },
              {
                n: '02',
                title: 'Write your track',
                body: 'Compose to spec in your DAW. Study the references, nail the mood and tempo, and bring your voice to the direction. Mix, master, and get it submission-ready.',
              },
              {
                n: '03',
                title: 'Submit and get feedback',
                body: 'Upload directly to the brief. Every Sonant submission gets written feedback — whether it\'s accepted or not. Tracks that fit the catalog get placed and pitched to real buyers.',
              },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div
                  className="text-6xl leading-none mb-6"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 300,
                    color: 'var(--border-hover)',
                  }}
                >
                  {n}
                </div>
                <h3
                  className="text-xl mb-3 text-[var(--text-primary)]"
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
      </section>

      {/* ── Catalog ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ The Catalog
              </div>
              <h2
                className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-6"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                This is where<br />
                your track<br />
                <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>
                  ends up.
                </span>
              </h2>
              <p
                className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-8 max-w-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Accepted tracks join the Sonant catalog on Disco, built for music supervisors and sync licensing. Your music, in front of real buyers.
              </p>
              <a
                href={DISCO_CATALOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                ↗ Listen to the Catalog
              </a>
            </div>

            <div>
              {[
                'Curated around what the market actually needs',
                'Written feedback on every submission — accepted or not',
                '70/30 in your favor on any placement',
                'Non-exclusive: your music stays yours',
                'One free submission per month, always',
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-4 py-5 border-b border-[var(--border-base)] first:border-t first:border-[var(--border-base)]"
                >
                  <span className="text-[#E85D2F] text-xs mt-0.5 shrink-0">◆</span>
                  <span
                    className="text-sm text-[var(--text-secondary)] leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div
                className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ FAQ
              </div>
              <h2
                className="text-3xl md:text-4xl tracking-tight leading-tight"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                How Sonant <span className="italic">works.</span>
              </h2>
            </div>
            <Link
              href="/faq"
              className="hidden md:block text-xs tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors shrink-0 mb-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              All questions →
            </Link>
          </div>
          <div className="border-t border-[var(--border-base)]">
            {[
              {
                q: 'What is Sonant?',
                a: 'A platform for composers who want to write music for brands, film, and games. Sonant publishes curated briefs written to real sync industry spec — the same format a music supervisor sends. Use them to practice, build your catalog, and submit your best work. Every submission gets written feedback. Tracks that fit get placed and pitched to real buyers.',
              },
              {
                q: 'What\'s the difference between a Sonant brief and a community brief?',
                a: 'Sonant briefs are curated by the Sonant team around what the catalog actually needs. Submitted tracks go through a review and, if accepted, get placed in the Sonant catalog and pitched to buyers. Community briefs are generated by composers using the Brief Generator — no review, no submission, just practice and reps.',
              },
              {
                q: 'What are the terms if my track gets placed?',
                a: 'You own your music. Sonant is non-exclusive. If Sonant brokers a placement, you keep 70% of the sync fee. You\'re free to pitch the same track anywhere else.',
              },
              {
                q: 'Do I need an account?',
                a: 'You can browse all briefs without an account. An account is required to submit to Sonant briefs, upload to community briefs, or generate your own. Creating one is free, and every account includes one Sonant brief submission per month.',
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-b border-[var(--border-base)] py-7 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6"
              >
                <h3
                  className="text-base text-[var(--text-primary)] leading-snug"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  {q}
                </h3>
                <p
                  className="text-sm text-[var(--text-muted)] leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
