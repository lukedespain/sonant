import React from 'react';
import { catalogPartnerFromBrief } from '@/lib/partners';
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark';
import { youtubeSearchUrlForTrack } from '@/lib/youtube-search';

export interface Reference {
  track: string;
  like?: string;
  avoid?: string;
  why?: string;
  url?: string;
}

export interface BriefLink {
  label: string;
  url: string;
}

export interface Brief {
  mode: 'brand' | 'film' | 'games';
  codename: string;
  briefId: string;
  issued: string;
  deadline?: string;
  closedAt?: string;
  homeFeatured?: boolean;
  client: string;
  classification: string;
  project: string;
  story: string;
  ask: string;
  direction: string[];
  references: Reference[];
  genrePalette: string;
  emotionalArc: string;
  tempo: string;
  key: string;
  length: string;
  vocals: string;
  imageUrl?: string;
  kind?: 'client' | 'catalog';
  catalogId?: string;
  projectTitle?: string;
  brandName?: string;
  winFee?: string;
  demoFee?: string;
  links?: BriefLink[];
  // Legacy fields — old saved briefs may have these; ignored in new layout
  greeting?: string;
  considerations?: { label: string; body: string }[];
  avoid?: string[];
  deliverables?: string[];
  terms?: { fee: string; [key: string]: string | undefined };
  fileNaming?: string;
  format?: string;
  deliverable?: string;
  usage?: string;
}

/** Human label for a brief, shared by the page and the PDF. */
export function briefKindLabel(brief: Pick<Brief, 'kind' | 'catalogId'>, isCatalog: boolean): string {
  if (brief.kind === 'client') return 'Client brief';
  if (isCatalog || catalogPartnerFromBrief(brief)) return 'Catalogue brief';
  return 'Brief';
}

/** One row of the spec sheet: label on the left, content on the right. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="grid md:grid-cols-[200px_minmax(0,1fr)] gap-x-10 gap-y-3 py-8 md:py-10"
      style={{ borderTop: '1px solid var(--brief-divider)' }}
    >
      <h2 className="text-[15px] tracking-[-0.01em]" style={{ color: 'var(--brief-text-meta)' }}>
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[13px] mb-1" style={{ color: 'var(--brief-text-meta)' }}>{label}</dt>
      <dd className="text-[16px] leading-snug" style={{ color: 'var(--brief-text-h)' }}>{value}</dd>
    </div>
  );
}

export default function BriefDocument({ brief, isFeatured = false }: { brief: Brief; isFeatured?: boolean }) {
  const partner = catalogPartnerFromBrief(brief);
  const isClient = brief.kind === 'client';
  const kindLabel = briefKindLabel(brief, isFeatured);
  const title = brief.projectTitle || brief.codename;
  const meta = [
    brief.briefId,
    brief.issued ? `Issued ${brief.issued}` : null,
    brief.deadline ? `Due ${brief.deadline}` : null,
  ].filter(Boolean);

  return (
    <article className="brief-document w-full" style={{ color: 'var(--brief-text-h)' }}>
      {/* Masthead */}
      <header className="pt-6 md:pt-10 pb-10 md:pb-14">
        <div className="hidden print:flex items-center justify-between gap-4 mb-10 text-[15px]">
          <span className="flex items-center gap-2.5">
            <ThoughtCollectiveMark size={20} />
            <span className="font-medium tracking-[-0.01em]">Thought Collective</span>
          </span>
          <span style={{ color: 'var(--brief-text-meta)' }}>{kindLabel}</span>
        </div>
        <h1
          className="font-medium tracking-[-0.045em] leading-[0.95] text-[2.75rem] sm:text-6xl md:text-[5.5rem] text-balance"
          style={{ fontFamily: 'var(--brand-display)' }}
        >
          {title}
        </h1>
        {!isClient && brief.project && (
          <p className="mt-6 text-[19px] md:text-[21px] leading-[1.45] tracking-[-0.01em] max-w-3xl" style={{ color: 'var(--brief-text-body)' }}>
            {brief.project}
          </p>
        )}
        <p className="mt-5 text-[15px] tabular-nums" style={{ color: 'var(--brief-text-meta)' }}>
          {[brief.client && isClient ? brief.client : null, ...meta].filter(Boolean).join(' · ')}
        </p>
      </header>

      {brief.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brief.imageUrl} alt="" className="w-full aspect-[16/9] md:aspect-[21/9] object-cover mb-4" style={{ display: 'block' }} />
      )}

      <Row label="The scene">
        <p className="text-[21px] md:text-[26px] leading-[1.4] tracking-[-0.02em] max-w-3xl">{brief.story}</p>
      </Row>

      <Row label="The music">
        <p className="text-[17px] leading-relaxed max-w-3xl" style={{ color: 'var(--brief-text-body)' }}>{brief.ask}</p>
      </Row>

      {brief.direction.length > 0 && (
        <Row label="Direction">
          <ol className="max-w-3xl">
            {brief.direction.map((d, i) => (
              <li
                key={i}
                className="grid grid-cols-[32px_1fr] py-3 text-[17px] leading-snug"
                style={{ borderTop: i === 0 ? undefined : '1px solid var(--brief-divider)', color: 'var(--brief-text-body)' }}
              >
                <span className="tabular-nums text-[15px]" style={{ color: 'var(--brief-text-meta)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </Row>
      )}

      {brief.references.length > 0 && (
        <Row label="References">
          <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-8 max-w-4xl">
            {brief.references.map((r, i) => {
              const href = partner ? youtubeSearchUrlForTrack(r.track) : r.url;
              return (
                <li key={i}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[17px] font-medium tracking-[-0.01em] hover:opacity-70 transition-opacity">
                      {r.track} ↗
                    </a>
                  ) : (
                    <p className="text-[17px] font-medium tracking-[-0.01em]">{r.track}</p>
                  )}
                  {(r.like || r.why) && (
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--brief-text-body)' }}>
                      <span style={{ color: 'var(--brief-text-h)' }}>Use</span>
                      <span style={{ color: 'var(--brief-text-meta)' }}> · </span>
                      {r.like ?? r.why}
                    </p>
                  )}
                  {r.avoid && (
                    <p className="mt-1 text-[15px] leading-relaxed" style={{ color: 'var(--brief-text-meta)' }}>
                      <span>Skip · </span>
                      {r.avoid}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Row>
      )}

      {!partner && brief.links && brief.links.length > 0 && (
        <Row label="Files and links">
          <ul className="space-y-2">
            {brief.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[17px] hover:opacity-70 transition-opacity break-all">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </Row>
      )}

      <Row label="Sound">
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 max-w-4xl">
          <Spec label="Genre" value={brief.genrePalette} />
          <Spec label="Mood" value={brief.emotionalArc} />
          <Spec label="Tempo" value={brief.tempo} />
          <Spec label="Key" value={brief.key} />
          <Spec label="Length" value={brief.length} />
          <Spec label="Type" value={brief.vocals} />
        </dl>
      </Row>

      {partner && (
        <Row label="The deal">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 max-w-4xl mb-6">
            <Spec label="Catalogue" value={partner.name} />
            <Spec label="Rights" value={partner.exclusive ? 'Exclusive' : 'Non-exclusive'} />
            <Spec label="Sync fees" value={`${partner.split} split`} />
          </dl>
          <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--brief-text-body)' }}>
            Accepted tracks go into the {partner.name} catalogue{partner.exclusive ? ' exclusively' : ''}, and we pitch them to agencies and brands. If one places, the sync fee splits {partner.split}.
            {partner.humanMadeOnly ? ' Human-made only: no AI-generated music, stems, or vocals.' : ''}
          </p>
        </Row>
      )}

      {isClient && (
        <Row label="The opportunity">
          {(brief.demoFee || brief.winFee || brief.deadline) && (
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 max-w-4xl mb-6">
              <Spec label="Due" value={brief.deadline} />
              <Spec label="Demo fee" value={brief.demoFee} />
              <Spec label="Win" value={brief.winFee} />
            </dl>
          )}
          <div className="space-y-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--brief-text-body)' }}>
            <p>Verified composers only. These are paying clients, so treat it like the job.</p>
            <p>
              Thought Collective is the intermediary. You write to this brief and we review what you submit. If it is strong enough to send to the client, we secure you a demo fee, and that fee covers any back and forth to get it closer.
            </p>
            <p>If the track wins the job, we split 70/30 in your favour.</p>
            <p>These jobs move fast. Only submit if you can stay available for edits if yours goes to the client.</p>
          </div>
        </Row>
      )}

      <footer
        className="pt-6 flex flex-wrap items-center justify-between gap-3 text-[13px]"
        style={{ borderTop: '1px solid var(--brief-divider)', color: 'var(--brief-text-meta)' }}
      >
        <span className="tabular-nums">{brief.briefId} · {kindLabel}</span>
        <span>{isClient ? 'Confidential. Please do not forward.' : 'wearethoughtcollective.com'}</span>
      </footer>
    </article>
  );
}
