import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID } from '@/lib/admin';
import { CATALOG_PARTNER_LIST, catalogPartnerFromBrief, type CatalogPartner } from '@/lib/partners';
import { VERIFICATION_THRESHOLD } from '@/lib/verification';

export const metadata: Metadata = {
  title: 'Catalogs | Sonant',
  description: 'The music houses Sonant writes for, and the terms on each.',
};

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

const STEPS = [
  { title: 'Write to a catalog brief', body: 'Each one belongs to a catalog and says what they are looking for.' },
  { title: 'Submit with a credit', body: 'Every submission gets written notes, whether it goes further or not.' },
  { title: 'The strongest go to the catalog', body: 'They make the final call. You usually hear back within a week.' },
  { title: 'If they take it, you sign on', body: 'You get their terms and send what they need: your PRO details and stems.' },
];

export default async function CatalogPage() {
  const admin = createAdminClient();
  const { data: briefs } = await admin
    .from('briefs')
    .select('generated_content')
    .eq('user_id', ADMIN_USER_ID)
    .eq('brief_type', 'catalog');

  const openBriefs: Record<string, number> = {};
  for (const b of briefs ?? []) {
    const id = catalogPartnerFromBrief(b.generated_content)?.id ?? 'sonant';
    openBriefs[id] = (openBriefs[id] ?? 0) + 1;
  }

  return (
    <div className="pt-16 md:pt-20 pb-20 flex-1 min-w-0 overflow-x-clip">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <header className="mb-12 max-w-2xl">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4" style={{ ...serif, fontWeight: 300 }}>
            The Catalogs.
          </h1>
          <p className="text-base text-[var(--text-tertiary)] leading-relaxed" style={sans}>
            The music houses Sonant writes for. Every catalog brief belongs to one of them, and the strongest submissions go straight to that catalog.
          </p>
        </header>

        <div className="flex flex-col gap-5 mb-20">
          {CATALOG_PARTNER_LIST.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} openBriefs={openBriefs[partner.id] ?? 0} />
          ))}
        </div>

        <section className="border-t border-[var(--border-base)] pt-12">
          <h2 className="text-3xl md:text-4xl tracking-tight mb-10" style={{ ...serif, fontWeight: 300 }}>
            How a placement <span className="italic">happens</span>.
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-[var(--border-card)] pt-5">
                <div className="text-3xl text-[var(--text-dimmer)] mb-4" style={{ ...serif, fontWeight: 300 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-lg text-[var(--text-primary)] mb-2" style={{ ...serif, fontWeight: 400 }}>
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed" style={sans}>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-12 text-[10px] tracking-[0.2em] uppercase text-[#E85D2F]" style={mono}>
            ◆ {VERIFICATION_THRESHOLD} accepted tracks unlock paid client briefs
          </p>
        </section>
      </div>
    </div>
  );
}

function PartnerMark({ partner }: { partner: CatalogPartner }) {
  if (partner.markSrc) {
    return (
      <div className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#F5EFE0]" style={{ borderRadius: '2px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={partner.markSrc} alt="" width={26} height={26} className="w-[26px] h-[26px] object-contain" />
      </div>
    );
  }
  return (
    <div
      className="w-11 h-11 shrink-0 flex items-center justify-center text-lg"
      style={{ background: '#E85D2F', color: 'var(--bg-base)', borderRadius: '2px', ...serif, fontWeight: 600 }}
      aria-hidden="true"
    >
      ◆
    </div>
  );
}

function PartnerCard({
  partner,
  openBriefs,
}: {
  partner: CatalogPartner;
  openBriefs: number;
}) {
  const terms: [string, string][] = [
    ['Deal', partner.exclusive ? 'Exclusive' : 'Non-exclusive'],
    ['Split', `${partner.split} on placements`],
    ['Focus', partner.focus],
    ['Open briefs', String(openBriefs)],
  ];
  const linkClass =
    'text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[#E85D2F] transition-colors';

  return (
    <article
      className="grid grid-cols-1 md:grid-cols-[1fr_280px] border border-[var(--border-card)] bg-[var(--bg-card)]"
      style={{ borderRadius: '2px' }}
    >
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <PartnerMark partner={partner} />
          <div className="min-w-0">
            <h2 className="text-3xl tracking-tight leading-tight text-[var(--text-primary)]" style={{ ...serif, fontWeight: 400 }}>
              {partner.name}
            </h2>
            <div
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F]"
              style={mono}
            >
              {partner.exclusive ? 'Exclusive' : 'Non-exclusive'} · {partner.split}
            </div>
          </div>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] leading-relaxed max-w-xl mb-8" style={sans}>
          {partner.blurb}
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <a
            href={partner.catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Hear the catalog ↗
          </a>
          {partner.id !== 'sonant' && (
            <a href={partner.site} target="_blank" rel="noopener noreferrer" className={linkClass} style={mono}>
              Website ↗
            </a>
          )}
        </div>
      </div>

      <dl className="border-t md:border-t-0 md:border-l border-[var(--border-card)] p-8 md:p-10 grid grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-5 content-center">
        {terms.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-1" style={mono}>
              {label}
            </dt>
            <dd className="text-sm text-[var(--text-primary)]" style={{ ...sans, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
