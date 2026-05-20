import React from 'react';

export interface Reference {
  track: string;
  why: string;
}

export interface Consideration {
  label: string;
  body: string;
}

export interface Brief {
  mode: 'brand' | 'film' | 'games';
  codename: string;
  briefId: string;
  issued: string;
  deadline: string;
  client: string;
  classification: string;
  project: string;
  deliverable: string;
  usage: string;
  greeting: string;
  story: string;
  ask: string;
  considerations: Consideration[];
  direction: string[];
  genrePalette: string;
  emotionalArc: string;
  references: Reference[];
  tempo: string;
  key: string;
  length: string;
  format: string;
  fileNaming: string;
  avoid: string[];
  deliverables: string[];
  terms: {
    fee: string;
    backend: string;
    exclusivity: string;
  };
  submitUrl: string;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div className="text-sm leading-snug" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="flex items-baseline gap-5 mb-5">
        <span className="text-xs tracking-[0.25em] text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {number}
        </span>
        <h2 className="text-2xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
          {title}
        </h2>
        <div className="flex-1 border-b border-[#2A2620]/20" />
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

export default function BriefDocument({ brief }: { brief: Brief }) {
  return (
    <div
      className="relative shadow-2xl brief-document"
      style={{
        background: 'linear-gradient(180deg, #F5EFE0 0%, #F2EBDA 100%)',
        color: '#1A1815',
        borderRadius: '2px',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\"), linear-gradient(180deg, #F5EFE0 0%, #F2EBDA 100%)",
      }}
    >
      <div className="p-10 md:p-16">
        <div className="flex items-start justify-between mb-12 pb-8 border-b border-[#2A2620]/30">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Music Brief / {brief.classification}
            </div>
            <h1 className="text-5xl md:text-6xl tracking-tight leading-none mb-4" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Project <span className="italic" style={{ fontWeight: 400 }}>{brief.codename}</span>
            </h1>
            <div className="text-xs tracking-wider text-[#5A5650]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Brief No. {brief.briefId} · Issued {brief.issued}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680] mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Deadline
            </div>
            <div className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {brief.deadline}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <MetaItem label="Client" value={brief.client} />
          <MetaItem label="Project" value={brief.project} />
          <MetaItem label="Deliverable" value={brief.deliverable} />
          <MetaItem label="Usage" value={brief.usage} />
        </div>

        <Section number="01" title="The Story">
          <p className="text-2xl leading-snug mb-6 whitespace-pre-line" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            {brief.greeting}
          </p>
          <p className="text-lg leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {brief.story}
          </p>
        </Section>

        <Section number="02" title="The Music">
          <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {brief.ask}
          </p>
        </Section>

        <Section number="03" title="Considerations">
          <div className="space-y-6">
            {brief.considerations.map((c, i) => (
              <div key={i} className="border-l-2 border-[#E85D2F] pl-5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {c.label}
                </div>
                <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section number="04" title="Sonic Direction">
          <ul className="space-y-3">
            {brief.direction.map((d, i) => (
              <li key={i} className="flex gap-4 items-baseline">
                <span className="text-[10px] text-[#8A8680] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {d}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="05" title="References & Tonal Frame">
          <div className="space-y-5 mb-8">
            <KV label="Genre Palette" value={brief.genrePalette} />
            <KV label="Emotional Arc" value={brief.emotionalArc} />
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Reference Tracks (energy, not imitation)
          </div>
          <ul className="space-y-5">
            {brief.references.map((r, i) => (
              <li key={i} className="flex gap-4 items-baseline">
                <span className="text-[#E85D2F] text-lg">→</span>
                <div>
                  <div className="text-base font-medium mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {r.track}
                  </div>
                  <div className="text-sm text-[#5A5650] italic leading-relaxed" style={{ fontFamily: "'Fraunces', serif" }}>
                    {r.why}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="06" title="Technical Specs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <KV label="Tempo" value={brief.tempo} />
            <KV label="Key" value={brief.key} />
            <KV label="Length" value={brief.length} />
            <KV label="Format" value={brief.format} />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              File Naming Convention
            </div>
            <div className="text-sm bg-[#1A1815]/5 border border-[#2A2620]/20 p-3" style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
              {brief.fileNaming}
            </div>
          </div>
        </Section>

        <Section number="07" title="What To Avoid">
          <ul className="space-y-2">
            {brief.avoid.map((a, i) => (
              <li key={i} className="flex gap-3 items-baseline" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#B33A1A]">×</span>
                <span className="text-base">{a}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="08" title="Deliverables If Selected">
          <ul className="space-y-2">
            {brief.deliverables.map((d, i) => (
              <li key={i} className="flex gap-3 items-baseline" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#5A5650]">—</span>
                <span className="text-base">{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section number="09" title="Commercial Terms">
          <div className="space-y-4">
            <KV label="Demo / Composition Fee" value={brief.terms.fee} />
            <KV label="Backend" value={brief.terms.backend} />
            <KV label="Exclusivity" value={brief.terms.exclusivity} />
          </div>
        </Section>

        <Section number="10" title="Submission">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Upload To
              </div>
              <div className="text-sm bg-[#1A1815]/5 border border-[#2A2620]/20 p-3" style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}>
                {brief.submitUrl}
              </div>
            </div>
            <p className="text-sm italic text-[#5A5650] leading-relaxed pt-3" style={{ fontFamily: "'Fraunces', serif" }}>
              Note: Please don&apos;t share this brief externally — it may contain sensitive information. Submissions become eligible for the Sonant Catalog if accepted.
            </p>
          </div>
        </Section>

        <div className="mt-12 pt-8 border-t border-[#2A2620]/30 flex items-center justify-between">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Generated for educational and inspiration purposes
          </div>
          <div className="text-xs italic text-[#5A5650]" style={{ fontFamily: "'Fraunces', serif" }}>
            Do your best work.
          </div>
        </div>
      </div>
    </div>
  );
}