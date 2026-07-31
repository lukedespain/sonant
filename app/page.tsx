import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

const MODE_LABELS: Record<string, string> = {
  brand: 'Brand',
  film: 'Film',
  games: 'Game',
};

interface BriefContent {
  codename?: string;
  project?: string;
  story?: string;
  ask?: string;
  genrePalette?: string;
  emotionalArc?: string;
  tempo?: string;
  client?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

interface FeaturedBrief {
  id: string;
  mode: string;
  generated_content: BriefContent;
}

export default async function LandingPage() {
  const admin = createAdminClient();

  const { data: briefs } = await admin
    .from('briefs')
    .select('id, mode, generated_content')
    .eq('user_id', ADMIN_USER_ID)
    .not('generated_content->imageUrl', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<FeaturedBrief[]>();

  const featured = briefs?.[0] ?? null;
  const gc = featured?.generated_content ?? null;

  const steps = [
    {
      n: '01',
      title: 'Choose a brief',
      body: 'Generate one with the Brief Generator, or write to an active Sonant brief. Brand, film, or game.',
    },
    {
      n: '02',
      title: 'Write your track',
      body: 'Take the brief into your DAW. Study the references, match the spec, bring your voice.',
    },
    {
      n: '03',
      title: 'Submit or upload',
      body: 'Submit privately to a Sonant brief for review and feedback — or upload publicly to a community brief.',
    },
  ];

  return (
    <div className="flex-1">

      {/* ── Hero ── */}
      <section className="min-h-[88vh] flex flex-col justify-center max-w-6xl mx-auto px-6 md:px-10 pt-24 pb-16">
        <div
          className="text-[10px] tracking-[0.5em] uppercase text-[#E85D2F] mb-8"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Built for composers, by composers.
        </div>
        <h1
          className="tracking-tight leading-[0.92] mb-8"
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 'clamp(3.5rem, 9vw, 7.5rem)',
          }}
        >
          Write to a brief.<br />
          <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>
            Build your catalog.
          </span>
        </h1>
        <p
          className="text-base md:text-lg text-[var(--text-tertiary)] mb-3 max-w-md leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Sonant is a brief tool and submission platform for composers building a sync catalog.
        </p>
        <p
          className="text-sm text-[var(--text-muted)] mb-10 max-w-md leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          A brief is the creative direction a client or supervisor gives you — what the music needs to do, not just how it should sound.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <Link
            href="/generator"
            className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Generate a Brief
          </Link>
          <Link
            href="/browse"
            className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Browse Sonant Briefs →
          </Link>
        </div>
      </section>

      {/* ── Choose Your Path ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="pb-12 md:pb-0 md:pr-16 border-b border-[var(--border-base)] md:border-b-0 md:border-r md:border-[var(--border-base)]">
              <div
                className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-muted)] mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Practice publicly
              </div>
              <p
                className="text-xl md:text-2xl text-[var(--text-primary)] leading-snug mb-6"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                Generate a brief, write your track, and upload your take alongside other composers. No review — just reps.
              </p>
              <Link
                href="/generator"
                className="text-xs tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Try the generator →
              </Link>
            </div>
            <div className="pt-12 md:pt-0 md:pl-16">
              <div
                className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-muted)] mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Submit privately
              </div>
              <p
                className="text-xl md:text-2xl text-[var(--text-primary)] leading-snug mb-6"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                Write to a curated Sonant brief. Submit privately, receive written feedback, and be considered for catalog placement.
              </p>
              <Link
                href="/browse"
                className="text-xs tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Browse Sonant Briefs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Brief ── */}
      {featured && gc && (
        <section className="border-t border-[var(--border-base)]">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
            <div
              className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-12"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ Active Sonant Brief
            </div>

            {gc.imageUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div className="overflow-hidden" style={{ borderRadius: '2px' }}>
                  <img
                    src={gc.imageUrl}
                    alt=""
                    className="w-full object-cover"
                    style={{ maxHeight: '460px', objectPosition: 'center' }}
                  />
                </div>
                <div>
                  <FeaturedBriefContent featured={featured} gc={gc} />
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <FeaturedBriefContent featured={featured} gc={gc} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── How it Works ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
          <div
            className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-10"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ How it works
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[var(--border-base)]">
            {steps.map(({ n, title, body }, i) => (
              <div
                key={n}
                className={[
                  'pt-8 pb-8 flex gap-5',
                  i === 0 && 'border-b border-[var(--border-base)] md:border-b-0 md:border-r md:pr-10',
                  i === 1 && 'border-b border-[var(--border-base)] md:border-b-0 md:border-r md:px-10',
                  i === 2 && 'md:pl-10',
                ].filter(Boolean).join(' ')}
              >
                <span
                  className="text-[10px] text-[var(--text-dimmer)] shrink-0 mt-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {n}
                </span>
                <div>
                  <h3
                    className="text-base mb-2 text-[var(--text-primary)]"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support Strip ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="pb-10 md:pb-0 md:pr-14 border-b border-[var(--border-base)] md:border-b-0 md:border-r md:border-[var(--border-base)]">
              <div
                className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ 1:1 Feedback
              </div>
              <p
                className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                45-minute sessions. Listen to your track together, compare it against the brief, get specific notes in real time. $50 standard · $25 for Pro members.
              </p>
              <Link
                href="/feedback"
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Book a session →
              </Link>
            </div>
            <div className="pt-10 md:pt-0 md:pl-14">
              <div
                className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ Pro Membership
              </div>
              <p
                className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                $12/month. Three submission credits per month, 50% off sessions, and a welcome feedback call. Cancel anytime.
              </p>
              <Link
                href="/account"
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                See Pro benefits →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="max-w-xl">
            <div
              className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ Your Account
            </div>
            <h2
              className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              One free submission<br />
              <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>
                credit per month.
              </span>
            </h2>
            <p
              className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Every free account includes one submission credit per month. Credits carry over. Every submission — accepted or not — gets written feedback.
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/signup"
                className="px-7 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                ◆ Create Free Account
              </Link>
              <Link
                href="/account"
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div
                className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ FAQ
              </div>
              <h2
                className="text-3xl tracking-tight"
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
                a: 'A platform for composers who want to write music for brands, film, and games. Sonant publishes curated briefs written to real sync industry spec. Use them to practice, build your catalog, and submit your best work. Every submission gets written feedback. Tracks that fit get placed and pitched to real buyers.',
              },
              {
                q: "What's the difference between a Sonant brief and a community brief?",
                a: 'Sonant briefs are curated by the Sonant team around what the catalog actually needs. Submitted tracks go through a review and, if accepted, get placed in the Sonant catalog and pitched to buyers. Community briefs are generated by composers using the Brief Generator — no review, no submission, just practice and reps.',
              },
              {
                q: 'What are the terms if my track gets placed?',
                a: "You own your music. Sonant is non-exclusive. If Sonant brokers a placement, you keep 70% of the sync fee. You're free to pitch the same track anywhere else.",
              },
              {
                q: 'Do I need an account?',
                a: 'You can browse all briefs without an account. An account is required to submit to Sonant briefs, upload to community briefs, or generate your own. Creating one is free, and every account includes one Sonant brief submission per month.',
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-b border-[var(--border-base)] py-6 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6"
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

function FeaturedBriefContent({ featured, gc }: { featured: FeaturedBrief; gc: BriefContent }) {
  return (
    <>
      <div
        className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {MODE_LABELS[featured.mode] ?? featured.mode} Brief
      </div>
      <h2
        className="text-4xl md:text-5xl tracking-tight leading-[1.05] italic mb-8 text-[var(--text-primary)]"
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
      >
        {gc.codename ?? 'Untitled'}
      </h2>
      {gc.story && (
        <div className="mb-6">
          <div
            className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The Scene
          </div>
          <p
            className="text-sm text-[var(--text-secondary)] leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {gc.story}
          </p>
        </div>
      )}
      {gc.ask && (
        <div className="mb-8 pl-4 border-l-2 border-[#E85D2F]">
          <div
            className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The Music
          </div>
          <p
            className="text-sm text-[var(--text-muted)] leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {gc.ask}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-8">
        {gc.genrePalette && (
          <span
            className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] border border-[var(--border-base)] px-3 py-1.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            {gc.genrePalette}
          </span>
        )}
        {gc.tempo && (
          <span
            className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] border border-[var(--border-base)] px-3 py-1.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            {gc.tempo}
          </span>
        )}
        {gc.emotionalArc && (
          <span
            className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] border border-[var(--border-base)] px-3 py-1.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            {gc.emotionalArc}
          </span>
        )}
      </div>
      <Link
        href={`/browse/${featured.id}`}
        className="inline-block px-7 py-3.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        Read this brief →
      </Link>
    </>
  );
}
