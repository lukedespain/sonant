'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { saveBrief } from '@/app/briefs/actions';
import { generateBrief as generateBriefAction } from '@/app/briefs/generate';
import { BRAND_CATEGORIES, FILM_CATEGORIES, GAME_CATEGORIES } from '@/lib/brief-patterns';

// ---------- TYPES ----------
type Mode = 'brand' | 'film' | 'games';

interface Target {
  name: string;
  tag: string;
}

interface ModeData {
  label: string;
  sub: string;
  glyph: string;
  targetLabel: string;
  targetSub: string;
  targets: Target[];
}

interface Reference {
  track: string;
  why: string;
}

interface Consideration {
  label: string;
  body: string;
}

interface Brief {
  mode: Mode;
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

// ---------- DATA ----------
const MODES: Record<Mode, ModeData> = {
  brand: {
    label: 'Brand & Advertising',
    sub: 'Sync briefs aligned with major brand categories',
    glyph: '◆',
    targetLabel: 'Pick a world',
    targetSub: 'Where do you want your music to live',
    targets: Object.values(BRAND_CATEGORIES).map((c) => ({
      name: c.name,
      tag: c.tag,
    })),
  },
  film: {
    label: 'Film & Television',
    sub: 'Score and song briefs for film, TV, and trailers',
    glyph: '▷',
    targetLabel: 'Pick a world',
    targetSub: 'Where do you want your music to live',
    targets: Object.values(FILM_CATEGORIES).map((c) => ({
      name: c.name,
      tag: c.tag,
    })),
  },
  games: {
    label: 'Video Games',
    sub: 'Soundtracks, themes, and trailer cues for game studios',
    glyph: '◈',
    targetLabel: 'Pick a world',
    targetSub: 'Where do you want your music to live',
    targets: Object.values(GAME_CATEGORIES).map((c) => ({
      name: c.name,
      tag: c.tag,
    })),
  },
};

const GENRES = [
  'Cinematic', 'Hip-Hop', 'Rock', 'Electronic', 'Pop',
  'Orchestral', 'Ambient', 'Folk', 'Indie', 'World/Ethnic',
];

const MOODS = [
  'Triumphant', 'Melancholic', 'Tense', 'Playful', 'Epic',
  'Intimate', 'Defiant', 'Hopeful', 'Mysterious', 'Euphoric',
];

const CODENAMES = [
  'MERIDIAN', 'NORTHSTAR', 'GRAVITY', 'EMBER', 'AURORA',
  'PARALLAX', 'LIGHTHOUSE', 'IRONCLAD', 'WAVEFORM', 'PHOENIX',
  'KINDRED', 'OBSIDIAN', 'SOLSTICE', 'HEARTLINE', 'BLACKBIRD',
];

const TEMPO_MAP: Record<string, string> = {
  Triumphant: '118–128 BPM',
  Melancholic: '60–78 BPM',
  Tense: '90–110 BPM',
  Playful: '105–120 BPM',
  Epic: '85–100 BPM (with half-time feel)',
  Intimate: '65–80 BPM',
  Defiant: '95–115 BPM',
  Hopeful: '88–104 BPM',
  Mysterious: '70–90 BPM',
  Euphoric: '124–130 BPM',
};

const REF_TRACKS: Record<string, Reference[]> = {
  Cinematic: [
    { track: 'Ludwig Göransson — "Can You Hear the Music" (Oppenheimer)', why: 'Builds inevitability without ever feeling forced. We want this kind of patience.' },
    { track: 'Hans Zimmer — "Day One" (Interstellar)', why: 'A single motif that earns its emotional payoff. Restraint, then release.' },
  ],
  'Hip-Hop': [
    { track: 'Run The Jewels — "Walking In The Snow"', why: 'The conviction in the delivery, not the genre. We want a track that feels this certain of itself.' },
    { track: 'Kendrick Lamar — "DNA."', why: 'Tempo flexibility and personality shifts inside one track. Lyrics are not right, but the energy is.' },
  ],
  Rock: [
    { track: 'Royal Blood — "Out of the Black"', why: 'Two-instrument arrangement that punches above its weight. Lean and threatening.' },
    { track: 'IDLES — "Never Fight a Man With a Perm"', why: 'Defiance without theatre. The vocal energy is what we want — not the literal words.' },
  ],
  Electronic: [
    { track: 'ODESZA — "A Moment Apart"', why: 'Cinematic without losing the dancefloor pulse. Build is everything.' },
    { track: 'Bonobo — "Cirrus"', why: 'Texture-led groove. Layers feel hand-built, not stacked.' },
  ],
  Pop: [
    { track: 'Caroline Polachek — "Welcome To My Island"', why: 'Hooky and weird at the same time. Personality first, polish second.' },
    { track: 'The Weeknd — "Blinding Lights"', why: "A pulse you can't escape, and a feeling that lands by 0:08. Reference for instant identity." },
  ],
  Orchestral: [
    { track: 'Hildur Guðnadóttir — "A Minor Score" (Joker)', why: 'Slow-burning unease. Patient, never bombastic.' },
    { track: 'Max Richter — "On the Nature of Daylight"', why: 'A theme that says everything by saying very little. The space between notes.' },
  ],
  Ambient: [
    { track: 'Brian Eno — "An Ending (Ascent)"', why: 'A held breath. We want this kind of trust in atmosphere.' },
    { track: 'Tim Hecker — "Black Refraction"', why: "Texture that shifts without you noticing it shifting. Composition by erosion." },
  ],
  Folk: [
    { track: 'Bon Iver — "Holocene"', why: 'Intimacy at scale. The recording feels like the room.' },
    { track: 'Big Red Machine — "Latter Days"', why: 'Hand-built instrumentation. Imperfections that read as character.' },
  ],
  Indie: [
    { track: 'Phoebe Bridgers — "I Know The End"', why: "A track that knows when to break its own rules. Reference for arc, not arrangement." },
    { track: 'Mitski — "Geyser"', why: 'Slow build into emotional release. The ending earns everything.' },
  ],
  'World/Ethnic': [
    { track: 'Nils Frahm — "Says"', why: 'A repeating phrase that becomes a feeling. Patience over progression.' },
    { track: 'Anoushka Shankar — "Land of Gold"', why: 'Tradition meeting modern production without diluting either.' },
  ],
};

// ---------- BRIEF GENERATOR ----------
// ---------- COMPONENTS ----------
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`group relative transition-all duration-200 px-4 py-2.5 text-sm rounded-full border tracking-wide ${
        active
          ? 'bg-[#F5EFE0] border-[#F5EFE0] text-[#0A0908]'
          : 'bg-transparent border-[#3A3835] text-[#C4BFB5] hover:border-[#6A6660] hover:text-[#F5F1E8]'
      }`}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: active ? 500 : 400,
        backgroundImage: active
          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23cn)' opacity='0.06'/%3E%3C/svg%3E\")"
          : undefined,
      }}
    >
      {children}
    </button>
  );
}

function ModeCard({ active, onClick, mode, data }: { active: boolean; onClick: () => void; mode: string; data: ModeData }) {
  const isComingSoon = mode !== 'BRAND';

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={`group relative text-left p-7 border transition-all duration-300 overflow-hidden ${
        isComingSoon
          ? 'bg-[#0F0E0D] border-[#1F1D1A] cursor-not-allowed opacity-50'
          : active
          ? 'bg-[#F5EFE0] border-[#F5EFE0]'
          : 'bg-[#141312] border-[#2A2826] hover:border-[#4A4642] hover:bg-[#181614]'
      }`}
      style={{
        borderRadius: '2px',
        backgroundImage: active && !isComingSoon
          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='mn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23mn)' opacity='0.07'/%3E%3C/svg%3E\")"
          : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <span className={`text-2xl transition-colors ${active && !isComingSoon ? 'text-[#E85D2F]' : 'text-[#5A5650] group-hover:text-[#8A8680]'}`}>
          {data.glyph}
        </span>
        <span
          className={`text-[10px] tracking-[0.2em] uppercase ${active && !isComingSoon ? 'text-[#8A8680]' : 'text-[#6A6660]'}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {isComingSoon ? 'COMING SOON' : `${mode}/01`}
        </span>
      </div>
      <h3
        className={`text-2xl mb-2 leading-tight ${active && !isComingSoon ? 'text-[#1A1815]' : 'text-[#F5F1E8]'}`}
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
      >
        {data.label}
      </h3>
      <p
        className={`text-sm leading-relaxed ${active && !isComingSoon ? 'text-[#5A5650]' : 'text-[#8A8680]'}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {data.sub}
      </p>
    </button>
  );
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

function BriefDocument({ brief }: { brief: Brief }) {
  return (
    <div
      className="relative shadow-2xl"
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

function NextSteps() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-20">
      <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        ◆ Next Steps
      </div>
      <h2 className="text-4xl md:text-5xl mb-3 tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
        Once your track is <span className="italic">ready</span>.
      </h2>
      <p className="text-base text-[#A8A39A] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        You&apos;ve written to the brief. Two paths from here, both designed to push the work further and get it in front of the right ears.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative p-8 border border-[#2A2826] bg-[#141312] hover:border-[#4A4642] transition-colors flex flex-col" style={{ borderRadius: '2px' }}>
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">↗</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#6A6660]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Submission · Path 01
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[#F5F1E8]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Submit to the <span className="italic">Sonant Catalog</span>
          </h3>
          <p className="text-sm text-[#A8A39A] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Submit your finished track + this brief for review. Selected work enters the Sonant Catalog — pitched to music supervisors at brands, agencies, studios, and game developers.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Reviewed by working composers and supervisors',
              'High-bar curation — not everything makes it',
              '70/30 split in composer favor on placements',
              'Non-exclusive: submit elsewhere too',
            ].map((b, i) => (
              <li key={i} className="flex gap-3 items-baseline text-sm text-[#C4BFB5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#E85D2F]">—</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <button className="w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#F5EFE0] text-[#0A0908] hover:bg-[#FFFFFF] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
              ↗ Submit Track
            </button>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#6A6660] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Free for members · Reviewed within 7 days
            </div>
          </div>
        </div>

        <div className="relative p-8 border border-[#E85D2F]/30 bg-[#141312] hover:border-[#E85D2F]/60 transition-colors flex flex-col" style={{ borderRadius: '2px' }}>
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">▶</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Live Review · Path 02
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[#F5F1E8]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Book a <span className="italic">1:1 Live Review</span>
          </h3>
          <p className="text-sm text-[#A8A39A] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            A real-time Zoom session with a working sync composer. We listen to your track in full, give feedback on whether you hit the brief, and tell you what would push it from good to placed.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Real-time playback and timestamped notes',
              'Honest assessment vs. brief intent',
              "Catalog-ready feedback (or what's missing)",
              'Recording of session sent after',
            ].map((b, i) => (
              <li key={i} className="flex gap-3 items-baseline text-sm text-[#C4BFB5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#E85D2F]">—</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button className="px-4 py-3.5 text-xs tracking-[0.15em] uppercase border border-[#E85D2F] text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[#0A0908] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                15 min · $45
              </button>
              <button className="px-4 py-3.5 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                30 min · $85
              </button>
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#6A6660] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Booked sessions usually within 5 days
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- MAIN APP ----------
export default function BriefGenerator({ user }: { user: { email: string; fullName: string } | null }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [generated, setGenerated] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const briefRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const loadingMessages = [
  'Drafting brief — this takes 30-60 seconds…',
  'Pattern selection underway…',
  'Composing reference architecture…',
  'Refining direction and considerations…',
  'Finalizing brief structure…',
];

  useEffect(() => {
  if (!loading) {
    setLoadingStep(0);
    return;
  }
  const interval = setInterval(() => {
    setLoadingStep((s) => Math.min(s + 1, loadingMessages.length - 1));
  }, 8000);
  return () => clearInterval(interval);
}, [loading, loadingMessages.length]);

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev));
  };

  const toggleMood = (m: string) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : prev.length < 3 ? [...prev, m] : prev));
  };

  const handleModeSelect = (m: Mode) => {
  if (m !== 'brand') {
    return;
  }
  setMode(m);
  setTarget(null);
  setGenres([]);
  setMoods([]);
  setGenerated(null);
  setTimeout(() => {
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
};

  const canGenerate = !!(mode && target && genres.length > 0 && moods.length > 0);

  const handleGenerate = async () => {
  if (!canGenerate || !mode || !target) return;
  if (mode !== 'brand') {
    return;
  }
  setLoading(true);
  setGenerated(null);

  try {
    const result = await generateBriefAction({
      mode,
      category: target,
      genres,
      moods,
    });

    if (result.error) {
      console.error('Generation error:', result.error);
      setLoading(false);
      alert(result.error);
      return;
    }

    if (result.brief) {
      setGenerated(result.brief);
      setLoading(false);
      setTimeout(() => {
        briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    setLoading(false);
    alert('Brief generation failed. Please try again.');
  }
};

  const handleReset = () => {
    setMode(null);
    setTarget(null);
    setGenres([]);
    setMoods([]);
    setGenerated(null);
  };
  const handleSave = async () => {
    if (!generated || !mode || !target) return;
    if (!user) return;

    setSaveStatus('saving');
    setSaveError(null);

    const result = await saveBrief({
      mode,
      target,
      genres,
      moods,
      generatedContent: generated as unknown as Record<string, unknown>,
    });

    if (result.error) {
      setSaveStatus('error');
      setSaveError(result.error);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0A0908',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        color: '#F5F1E8',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease-out forwards; }
        .pulse-soft { animation: pulse-soft 1.4s ease-in-out infinite; }
      `}</style>

      <nav className="border-b border-[#1F1D1A]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: '#E85D2F', color: '#0A0908', fontFamily: "'Fraunces', serif", fontWeight: 600, borderRadius: '2px' }}
            >
              ◆
            </div>
            <span className="text-base tracking-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
              Sonant<span className="text-[#E85D2F]">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#8A8680]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Link href="/library" className="hover:text-[#F5F1E8] cursor-pointer transition-colors">Library</Link>
            <span className="hover:text-[#F5F1E8] cursor-pointer transition-colors">Catalog</span>
            <span className="hover:text-[#F5F1E8] cursor-pointer transition-colors">Competitions</span>
            <span className="hover:text-[#F5F1E8] cursor-pointer transition-colors">Community</span>
          </div>
          {user ? (
            <Link
              href="/account"
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Custom Brief Generator / v0.2
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-8 max-w-5xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Briefs that get <span className="italic" style={{ fontWeight: 400 }}>written</span>.<br />
          Music that gets <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>placed</span>.
        </h1>
        <p className="text-lg md:text-xl text-[#A8A39A] max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
          Generate professional, industry-style sync briefs tailored to the brands, directors, and studios you actually want to work with. Build a catalog with intention.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Step 01
          </span>
          <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Choose a brief category
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(MODES) as [Mode, ModeData][]).map(([key, data]) => (
            <ModeCard
              key={key}
              mode={key.toUpperCase()}
              data={data}
              active={mode === key}
              onClick={() => handleModeSelect(key)}
            />
          ))}
        </div>
      </section>

      {mode && (
        <section ref={optionsRef} className="max-w-7xl mx-auto px-6 md:px-10 py-12 fade-up">
          <div className="mb-14">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Step 02
              </span>
              <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
                {MODES[mode].targetLabel}
              </h2>
            </div>
            <p className="text-sm text-[#8A8680] mb-6 ml-[5.5rem]">{MODES[mode].targetSub}</p>
            <div className="flex flex-wrap gap-2.5 ml-[5.5rem]">
              {MODES[mode].targets.map((t) => (
                <Chip key={t.name} active={target === t.name} onClick={() => setTarget(t.name)}>
                  {t.name}
                  <span className="ml-2 text-[9px] tracking-wider uppercase opacity-60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {t.tag}
                  </span>
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-14">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Step 03
              </span>
              <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
                Genre palette <span className="text-sm text-[#8A8680] ml-2">(up to 3)</span>
              </h2>
            </div>
            <p className="text-sm text-[#8A8680] mb-6 ml-[5.5rem]">Where your strengths live</p>
            <div className="flex flex-wrap gap-2.5 ml-[5.5rem]">
              {GENRES.map((g) => (
                <Chip key={g} active={genres.includes(g)} onClick={() => toggleGenre(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-14">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Step 04
              </span>
              <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
                Emotional arc <span className="text-sm text-[#8A8680] ml-2">(up to 3)</span>
              </h2>
            </div>
            <p className="text-sm text-[#8A8680] mb-6 ml-[5.5rem]">Where you want the listener to land</p>
            <div className="flex flex-wrap gap-2.5 ml-[5.5rem]">
              {MOODS.map((m) => (
                <Chip key={m} active={moods.includes(m)} onClick={() => toggleMood(m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>

          <div className="ml-[5.5rem]">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className={`px-8 py-4 text-sm tracking-[0.15em] uppercase transition-all ${
                  canGenerate && !loading
                    ? 'bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] cursor-pointer'
                    : 'bg-[#1F1D1A] text-[#5A5650] cursor-not-allowed'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                {loading ? '◆ Generating…' : '◆ Generate Brief'}
              </button>
              {(target || genres.length > 0 || moods.length > 0) && !loading && (
                <button
                  onClick={handleReset}
                  className="text-xs tracking-[0.2em] uppercase text-[#8A8680] hover:text-[#F5F1E8] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Reset
                </button>
              )}
            </div>
            {!canGenerate && !loading && (
              <p className="text-xs text-[#6A6660]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Select a category, target, at least one genre, and at least one mood to generate.
              </p>
            )}
          </div>
        </section>
      )}

      {loading && (
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-16 fade-up">
          <div className="ml-[5.5rem] max-w-xl">
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4 pulse-soft" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Working
            </div>
            <div className="text-2xl leading-relaxed text-[#F5F1E8]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              {loadingMessages[loadingStep]}
            </div>
            <div className="mt-8 flex gap-1.5">
              {loadingMessages.map((_, i) => (
                <div key={i} className={`h-px flex-1 transition-colors duration-300 ${i <= loadingStep ? 'bg-[#E85D2F]' : 'bg-[#2A2826]'}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {generated && !loading && (
        <>
          <section ref={briefRef} className="max-w-5xl mx-auto px-6 md:px-10 py-16 fade-up">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ◆ Brief Generated · {generated.briefId}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleGenerate}
                  className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  ↻ Regenerate
                </button>
                {user ? (
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                      saveStatus === 'saved'
                        ? 'border-[#7A9A6E] text-[#7A9A6E]'
                        : saveStatus === 'error'
                        ? 'border-[#FF8B6B] text-[#FF8B6B]'
                        : 'border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    {saveStatus === 'saving' ? '◆ Saving…' :
                     saveStatus === 'saved' ? '✓ Saved' :
                     saveStatus === 'error' ? '× ' + (saveError || 'Error') :
                     '☆ Save'}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    Sign in to Save
                  </Link>
                )}
                <button
                  className="text-xs tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  ↓ Export PDF
                </button>
              </div>
            </div>
            <BriefDocument brief={generated} />
          </section>
          <NextSteps />
        </>
      )}

      <footer className="border-t border-[#1F1D1A] mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-xs tracking-wider text-[#5A5650]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            SONANT · BUILT FOR COMPOSERS · DEMO v0.2
          </div>
          <div className="text-xs italic text-[#5A5650]" style={{ fontFamily: "'Fraunces', serif" }}>
            &ldquo;The brief is the gift. The work is the answer.&rdquo;
          </div>
        </div>
      </footer>
    </div>
  );
}
