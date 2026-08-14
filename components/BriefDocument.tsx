import React from 'react';

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

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.06'/%3E%3C/svg%3E\")";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3"
      style={{ fontFamily: "'JetBrains Mono', monospace", color: '#E85D2F' }}
    >
      <span>◆</span>
      <span>{children}</span>
    </div>
  );
}

function SonicItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-1"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-text-meta)' }}
      >
        {label}
      </div>
      <div
        className="text-sm leading-snug"
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: 'var(--brief-text-h)' }}
      >
        {value}
      </div>
    </div>
  );
}

export default function BriefDocument({ brief, isFeatured = false }: { brief: Brief; isFeatured?: boolean }) {
  return (
    <div
      className="relative shadow-2xl brief-document w-full overflow-hidden"
      style={{
        backgroundImage: `${NOISE_SVG}, linear-gradient(180deg, var(--brief-bg-from) 0%, var(--brief-bg-to) 100%)`,
        color: 'var(--brief-text-h)',
        borderRadius: '2px',
      }}
    >
      {/* Hero image */}
      {brief.imageUrl && (
        <div className="relative w-full" style={{ height: '260px' }}>
          <img
            src={brief.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ display: 'block' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, var(--brief-img-fade-from) 82%, var(--brief-img-fade-to) 100%)',
            }}
          />
        </div>
      )}

      <div className="p-8 md:p-12">
        {/* Header */}
        <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--brief-divider)' }}>
          <div className="mb-3">
            <div
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-text-meta)' }}
            >
              Music Brief
            </div>
          </div>
          <h1
            className="text-4xl md:text-5xl tracking-tight leading-none mb-3"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, color: 'var(--brief-text-h)' }}
          >
            Project{' '}
            <span className="italic" style={{ fontWeight: 400 }}>
              {brief.projectTitle || brief.codename}
            </span>
          </h1>
          <div
            className="text-xs tracking-wide"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-text-meta)' }}
          >
            {brief.briefId} · {brief.client}
            {brief.kind === 'client' ? '' : brief.brandName && brief.brandName !== brief.client ? ` · ${brief.brandName}` : ''}
            {brief.kind === 'client' ? '' : ` · ${brief.project}`}
            {' · '}Issued {brief.issued}
            {brief.deadline ? ` · Due ${brief.deadline}` : ''}
          </div>
        </div>

        {/* The Scene */}
        <div className="mb-8">
          <Label>The Scene</Label>
          <p
            className="text-xl md:text-2xl leading-relaxed"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, color: 'var(--brief-text-h)' }}
          >
            {brief.story}
          </p>
        </div>

        {/* The Music */}
        <div className="mb-8">
          <Label>The Music</Label>
          <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-body)' }}>
            {brief.ask}
          </p>
        </div>

        {/* Direction */}
        <div className="mb-8">
          <Label>Direction</Label>
          <ul className="space-y-2.5">
            {brief.direction.map((d, i) => (
              <li key={i} className="flex gap-3 items-baseline">
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-arrow)', flexShrink: 0 }}
                >
                  →
                </span>
                <span className="text-base leading-snug" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-body)' }}>
                  {d}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {brief.references.length > 0 && (
        <div className="mb-8">
          <Label>References</Label>
          <div className="space-y-5">
            {brief.references.map((r, i) => (
              <div key={i} className="pl-4" style={{ borderLeft: '2px solid var(--brief-ref-border)' }}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium mb-1.5 inline-block hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-h)' }}
                  >
                    {r.track} ↗
                  </a>
                ) : (
                  <div
                    className="text-base font-medium mb-1.5"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-h)' }}
                  >
                    {r.track}
                  </div>
                )}
                {(r.like || r.why) && (
                  <div
                    className="text-sm mb-1"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-body)' }}
                  >
                    <span className="font-semibold" style={{ color: 'var(--brief-use-color)' }}>Use:</span>{' '}
                    {r.like ?? r.why}
                  </div>
                )}
                {r.avoid && (
                  <div className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-body)' }}>
                    <span className="font-semibold" style={{ color: 'var(--brief-skip-color)' }}>Skip:</span>{' '}
                    {r.avoid}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {brief.links && brief.links.length > 0 && (
          <div className="mb-8">
            <Label>Files and links</Label>
            <ul className="space-y-3">
              {brief.links.map((link) => (
                <li key={link.url} className="flex gap-3 items-baseline">
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-arrow)', flexShrink: 0 }}
                  >
                    →
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base leading-snug hover:text-[#E85D2F] transition-colors break-all"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-h)' }}
                  >
                    {link.label}
                    <span
                      className="ml-2 text-[10px] tracking-[0.15em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-text-meta)' }}
                    >
                      Open ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sonic DNA */}
        <div className="mb-6">
          <Label>Sonic DNA</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <SonicItem label="Genre" value={brief.genrePalette} />
            <SonicItem label="Mood" value={brief.emotionalArc} />
            <SonicItem label="Tempo" value={brief.tempo} />
            <SonicItem label="Key" value={brief.key} />
            <SonicItem label="Length" value={brief.length} />
            <SonicItem label="Type" value={brief.vocals} />
          </div>
        </div>

        {brief.kind === 'client' && (
          <div className="mb-6 p-6" style={{ border: '1px solid var(--brief-divider)', borderRadius: '2px' }}>
            <Label>The opportunity</Label>
            {(brief.demoFee || brief.winFee || brief.deadline) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {brief.deadline && <SonicItem label="Due" value={brief.deadline} />}
                {brief.demoFee && <SonicItem label="Demo fee" value={brief.demoFee} />}
                {brief.winFee && <SonicItem label="Win" value={brief.winFee} />}
              </div>
            )}
            <div className="space-y-3 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--brief-text-body)' }}>
              <p>Verified composers only. These are paying clients. Treat it like the job, not practice.</p>
              <p>
                Sonant is the intermediary. You write to this brief. We review what you submit. If it is strong enough to send to the client, we secure you a demo fee. If they like it and want you on the back and forth to get it closer, that work is covered by the demo fee too.
              </p>
              <p>If the track wins the job, we split 70/30 in your favor.</p>
              <p>
                These jobs move fast. Do not submit unless you can stay available and on call for edits if yours is chosen to go to the client.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--brief-divider)' }}>
          <div
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--brief-text-meta)' }}
          >
            {brief.briefId} · {brief.kind === 'client' ? 'Client Brief' : isFeatured ? 'Sonant Brief' : 'Community Brief'}
          </div>
          {brief.kind === 'client' ? (
            <div className="text-xs italic" style={{ fontFamily: "'Fraunces', serif", color: 'var(--brief-text-meta)' }}>
              Be available. Move fast.
            </div>
          ) : isFeatured ? (
            <div className="text-xs italic" style={{ fontFamily: "'Fraunces', serif", color: 'var(--brief-text-meta)' }}>
              Write it. Submit it. Get placed.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
