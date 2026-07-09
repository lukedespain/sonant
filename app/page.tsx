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
  const { data: featuredBriefs } = await admin
    .from('briefs')
    .select('id, mode, generated_content')
    .eq('user_id', ADMIN_USER_ID)
    .not('generated_content->imageUrl', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)
    .returns<FeaturedBrief[]>();

  const briefs = featuredBriefs ?? [];

  return (
    <div className="flex-1" style={{ color: 'var(--text-primary)' }}>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 pt-24 pb-20">
        <div
          className="text-[10px] tracking-[0.45em] uppercase text-[#E85D2F] mb-6"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Sonant
        </div>
        <h1
          className="text-6xl md:text-7xl tracking-tight leading-[1.02] mb-6 max-w-3xl"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Write to briefs.{' '}
          <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>
            Get heard.
          </span>
        </h1>
        <p
          className="text-lg text-[var(--text-tertiary)] mb-10 max-w-xl leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          A practice ground and placement platform for composers. Study real creative briefs, write music to spec, and submit your best work to get in front of brands and music supervisors.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/browse"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Explore the Catalog
          </Link>
          <Link
            href="/generator"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Generate a Brief
          </Link>
        </div>
      </section>

      {/* ── Featured Briefs preview ── */}
      {briefs.length > 0 && (
        <section className="border-t border-[var(--border-base)] py-16">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <div
              className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ From the Catalog
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {briefs.map((brief) => {
                const codename = brief.generated_content?.codename ?? 'Untitled';
                const imageUrl = brief.generated_content?.imageUrl;
                const modeLabel = MODE_LABELS[brief.mode] ?? brief.mode;
                return (
                  <Link
                    key={brief.id}
                    href={`/browse/${brief.id}`}
                    className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] transition-colors group overflow-hidden"
                    style={{ borderRadius: '2px' }}
                  >
                    {imageUrl && (
                      <div className="relative w-full overflow-hidden" style={{ height: '140px' }}>
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to bottom, transparent 50%, var(--bg-card) 100%)' }}
                        />
                      </div>
                    )}
                    <div className="px-5 pb-5 pt-3">
                      <div
                        className="text-[9px] tracking-[0.25em] uppercase text-[#E85D2F] mb-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        ◆ Sonant Brief
                      </div>
                      <p
                        className="text-lg italic leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors"
                        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                      >
                        {codename}
                      </p>
                      <p
                        className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mt-1"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {modeLabel} Project
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/browse"
              className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              View all briefs →
            </Link>
          </div>
        </section>
      )}

      {/* ── Three pillars ── */}
      <section className="border-t border-[var(--border-base)] py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border-card)]" style={{ borderRadius: '2px' }}>
            {[
              {
                tag: '◆ Catalog',
                title: 'Real briefs. Real standards.',
                body: 'Sonant publishes creative briefs written to actual industry specs — the kind a music supervisor sends a composer. Browse them, write to them, and hear what others made.',
                cta: 'Browse the Catalog',
                href: '/browse',
              },
              {
                tag: '◆ Generator',
                title: 'Generate your own brief.',
                body: 'Build a custom brief for any project type — brand, film, or game. Write to it, upload your track, and use it as a portfolio piece that shows you can write to spec.',
                cta: 'Open the Generator',
                href: '/generator',
              },
              {
                tag: '◆ Reviews',
                title: 'Get feedback that matters.',
                body: 'Book a live music review and get real-time feedback on how well your track matches the brief. Learn what works, what needs work, and what would change the result.',
                cta: 'Book a Review',
                href: '/reviews',
              },
            ].map(({ tag, title, body, cta, href }) => (
              <div key={href} className="bg-[var(--bg-card)] p-8 flex flex-col">
                <div
                  className="text-[10px] tracking-[0.35em] uppercase text-[#E85D2F] mb-5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {tag}
                </div>
                <h2
                  className="text-2xl leading-tight mb-4 text-[var(--text-primary)]"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  {title}
                </h2>
                <p
                  className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 flex-1"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {body}
                </p>
                <Link
                  href={href}
                  className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Submit to the catalog ── */}
      <section className="border-t border-[var(--border-base)] py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <div
                className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ◆ Submissions
              </div>
              <h2
                className="text-4xl tracking-tight leading-[1.05] mb-5"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                Submit your music to the catalog.
              </h2>
              <p
                className="text-base text-[var(--text-tertiary)] leading-relaxed mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                If you've written to a Sonant featured brief and your track is ready, submit it for consideration. Accepted tracks join the Sonant catalog and get pitched directly to brands, agencies, and music supervisors.
              </p>
              <p
                className="text-sm text-[var(--text-muted)] leading-relaxed mb-8"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Every submission gets a written response. If it's not the right fit, you'll know why — and what would change that.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/browse"
                  className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                >
                  Browse Sonant Briefs
                </Link>
                <Link
                  href="/submissions"
                  className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  How It Works
                </Link>
              </div>
            </div>
            <div className="space-y-6">
              {[
                { num: '01', title: 'Browse the catalog', body: 'Find a Sonant brief that fits your style and strengths. Read it carefully — the details matter.' },
                { num: '02', title: 'Write to it', body: 'Compose your track to the brief\'s specs. Mood, arc, instrumentation — match the brief, not just the genre.' },
                { num: '03', title: 'Submit', body: 'Submit your track directly from the brief page. No fee, no forms, no middleman.' },
                { num: '04', title: 'Get a response', body: 'Every submission gets written feedback. Accepted tracks join the catalog and get pitched to real buyers.' },
              ].map(({ num, title, body }) => (
                <div key={num} className="flex gap-5">
                  <div
                    className="text-[10px] tracking-[0.3em] text-[#E85D2F] mt-1 shrink-0"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {num}
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium text-[var(--text-primary)] mb-1"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                    >
                      {title}
                    </div>
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
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="border-t border-[var(--border-base)] py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              Ready to start?
            </p>
            <p
              className="text-sm text-[var(--text-muted)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Pick a brief, write your music, and see where it goes.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/browse"
              className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Explore the Catalog
            </Link>
            <a
              href={DISCO_CATALOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Listen to the Music
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
