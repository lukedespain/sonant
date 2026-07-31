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

  return (
    <div className="flex-1">

      {/* ── Hero ── */}
      <section className="min-h-[88vh] flex flex-col justify-center max-w-6xl mx-auto px-6 md:px-10 pt-24 pb-16">
        <div
          className="text-[10px] tracking-[0.5em] uppercase text-[#E85D2F] mb-8"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Built for music composers.
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
            Build a catalog worth pitching.
          </span>
        </h1>
        <p
          className="text-base md:text-lg text-[var(--text-tertiary)] mb-10 max-w-lg leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          A <em>brief</em> is the creative direction a composer receives from a client or music supervisor. Sonant helps composers practice writing to briefs, receive written and live feedback, and build a sync catalog worth pitching.
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

      {/* ── Ready to start? ── */}
      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="max-w-xl">
            <h2
              className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              Ready to <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>start?</span>
            </h2>
            <p
              className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Create a free account to save briefs, upload community takes, and receive one private Sonant submission credit each month.
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
