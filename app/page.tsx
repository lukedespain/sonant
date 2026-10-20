import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID } from '@/lib/admin';
import { catalogPartnerFromBrief, CATALOG_PARTNER_LIST, CATALOG_PARTNERS } from '@/lib/partners';
import AboutQuestions from '@/components/AboutQuestions';
import { btn } from '@/components/ui';

const GUMROAD_URL = 'https://sonant.gumroad.com/l/royalties';

const STEPS = [
  {
    title: 'Practice',
    body: 'Generate a brief or pick a practice brief, and write a syncable track. It is yours to keep: build your catalog, release it as an artist, or just get the reps.',
  },
  {
    title: 'Submit to a catalog',
    body: 'Catalog briefs are built with partner catalogs from what their clients keep asking for. No deadline. Every submission gets written feedback, and the strongest go into the catalog.',
  },
  {
    title: 'Get paid work',
    body: 'Three catalog placements make you a verified composer. That opens paid client briefs: confidential, pre-release jobs with short turnarounds.',
  },
];

type HeroBrief = { id: string; title: string; logline: string; imageUrl: string; partner: string };

async function latestCatalogBrief(): Promise<HeroBrief | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('briefs')
    .select('id, generated_content')
    .eq('user_id', ADMIN_USER_ID)
    .eq('brief_type', 'catalog')
    .order('created_at', { ascending: false })
    .limit(50);
  type Content = {
    imageUrl?: string;
    codename?: string;
    projectTitle?: string;
    logline?: string;
    project?: string;
    homeFeatured?: boolean;
  } | null;
  const rows = data ?? [];
  // The admin-starred brief wins; otherwise the newest brief with an image.
  const ordered = [
    ...rows.filter((r) => (r.generated_content as Content)?.homeFeatured),
    ...rows.filter((r) => !(r.generated_content as Content)?.homeFeatured),
  ];
  for (const row of ordered) {
    const c = row.generated_content as Content;
    if (!c?.imageUrl) continue;
    return {
      id: row.id,
      title: c.projectTitle || c.codename || 'Untitled',
      logline: c.logline || c.project || '',
      imageUrl: c.imageUrl,
      partner: (catalogPartnerFromBrief(c) ?? CATALOG_PARTNERS.sonant).name,
    };
  }
  return null;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hero = await latestCatalogBrief();

  return (
    <div className="flex-1">
      <section className="max-w-6xl mx-auto px-5 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28 grid md:grid-cols-[1.15fr_1fr] gap-14 md:gap-16 items-center">
        <div>
          <p className="label text-[var(--accent)] mb-6">For sync composers</p>
          <h1 className="font-serif font-light tracking-tight leading-[0.98] text-[2.9rem] sm:text-6xl lg:text-7xl text-balance">
            Learn to compose music <span className="italic text-[var(--accent)]">worth pitching.</span>
          </h1>
          <p className="mt-7 text-lg text-[var(--text-tertiary)] leading-relaxed max-w-lg">
            Practice writing to spec with briefs built like the real thing. When a track is ready, submit it to a partner catalog for written feedback and a shot at placement.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {user ? (
              <Link href="/briefs" className={btn('primary')}>◆ Open briefs</Link>
            ) : (
              <Link href="/signup" className={btn('primary')}>◆ Create free account</Link>
            )}
            <Link href={user ? '/generator' : '/briefs'} className={btn('secondary')}>
              {user ? 'Try the generator' : 'See the briefs'}
            </Link>
          </div>
        </div>

        {hero && (
          <Link
            href={`/briefs/${hero.id}`}
            className="group block border border-[var(--border-card)] bg-[var(--bg-card)] rounded-[2px] overflow-hidden hover:border-[var(--accent-line)] transition-[border-color,transform] duration-500 md:rotate-[1.2deg] md:hover:rotate-0"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <p className="label text-[var(--accent)]">◆ {hero.partner} is looking for</p>
              <p className="mt-3 font-serif italic text-2xl tracking-tight">{hero.title}</p>
              {hero.logline && (
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2">{hero.logline}</p>
              )}
              <p className="mt-5 label text-[var(--text-dimmer)] group-hover:text-[var(--accent)] transition-colors">
                Open the brief →
              </p>
            </div>
          </Link>
        )}
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-20 md:py-24">
          <h2 className="font-serif font-light text-3xl md:text-4xl tracking-tight">How it works.</h2>
          <p className="mt-4 mb-12 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-xl">
            Custom scoring, artist sync, or catalogs: every path in sync starts with writing to spec.
          </p>
          <ol className="grid md:grid-cols-3 gap-10 md:gap-12">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-[var(--border-card)] pt-6">
                <span className="font-mono text-xs text-[var(--accent)] tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 font-serif text-2xl tracking-tight">{step.title}</h3>
                <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
            <span className="text-[var(--accent)]">◆ Human-made.</span> Sonant is built for composers, and catalogs are hearing it from their clients too: original music, no AI.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="label text-[var(--text-dimmer)]">Writing for</span>
            {CATALOG_PARTNER_LIST.map((p) => (
              <Link
                key={p.id}
                href="/catalogs"
                className="font-serif text-lg tracking-tight text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-20 md:py-24 grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
          <h2 className="font-serif font-light text-3xl md:text-4xl tracking-tight">Questions.</h2>
          <AboutQuestions />
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="max-w-xl">
            <p className="label text-[var(--accent)] mb-5">◆ The Sonant guide</p>
            <h2 className="font-serif font-light text-3xl md:text-4xl tracking-tight leading-[1.1]">
              Every royalty <span className="italic">you&apos;re owed.</span>
            </h2>
            <p className="mt-4 text-[15px] text-[var(--text-muted)] leading-relaxed">
              A placement pays out in more places than most composers collect from. The guide walks you through PRO, MRO, and the rest, with a catalog tracker and split sheet template.
            </p>
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className={btn('secondary', 'md', 'mt-8')}>
              Get the guide · $35 ↗
            </a>
          </div>
          <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" className="hidden md:block shrink-0" aria-label="Get the royalties guide">
            <Image
              src="/royalties-thumbnail.png"
              alt="Every Royalty You're Owed guide cover"
              width={220}
              height={220}
              className="border border-[var(--border-card)] rounded-[2px]"
            />
          </a>
        </div>
      </section>

      {!user && (
        <section className="border-t border-[var(--border-base)]">
          <div className="max-w-6xl mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
            <h2 className="font-serif font-light text-4xl md:text-5xl tracking-tight">
              Ready to <span className="italic text-[var(--accent)]">compose?</span>
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">Free account. One submission credit every month.</p>
            <Link href="/signup" className={btn('primary', 'md', 'mt-8')}>◆ Create free account</Link>
          </div>
        </section>
      )}
    </div>
  );
}
