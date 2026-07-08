'use client';

import { useState } from 'react';
import type { Brief } from './BriefDocument';

const GENRE_INSTRUMENTS: Record<string, string> = {
  'ambient': 'synth pads, sustained drones',
  'orchestral': 'strings, orchestra',
  'neo-classical': 'piano, chamber strings',
  'folk / acoustic': 'acoustic guitar, fingerpicked, natural recording',
  'folk/acoustic': 'acoustic guitar, fingerpicked',
  'jazz': 'jazz piano, upright bass, brushed drums',
  'hip-hop': 'sampled drums, lo-fi beats',
  'electronic': 'synthesizer, drum machine',
  'rock': 'electric guitar, live drums',
  'cinematic': 'cinematic strings, film score',
  'r&b / soul': 'warm bass, soul production',
  'indie': 'indie production, layered guitars',
  'country': 'acoustic guitar, pedal steel',
  'alternative': 'alternative guitar, indie drums',
  'pop': 'pop production, melodic hooks',
};

function extractDirectionTags(direction: string[]): string[] {
  const tags: string[] = [];
  const SKIP_STARTERS = /^(think|avoid|lean into|lean toward|use |build |keep |let |make |create |try |write |consider |explore |focus |one or two|the track|your track|this track|ensure|if there)/i;

  for (const d of direction.slice(0, 4)) {
    const trimmed = d.trim();
    if (SKIP_STARTERS.test(trimmed)) continue;
    const clause = trimmed.split(/[.,]/)[0].trim().toLowerCase();
    const words = clause.split(/\s+/).slice(0, 6).join(' ');
    if (words.length >= 4 && words.length <= 50) tags.push(words);
  }
  return tags;
}

function buildStylePrompt(brief: Brief): string {
  const tags: string[] = [];

  // 1. Genre tags (split and lowercase)
  brief.genrePalette
    .split(/[,/]/)
    .map(g => g.trim().toLowerCase())
    .filter(Boolean)
    .forEach(g => tags.push(g));

  // 2. Mood/emotional arc
  brief.emotionalArc
    .split(/[,/]/)
    .map(m => m.trim().toLowerCase())
    .filter(Boolean)
    .forEach(m => tags.push(m));

  // 3. Instrumentation from genre (one hint per matched genre)
  const genres = brief.genrePalette.split(/[,/]/).map(g => g.trim().toLowerCase());
  const addedInstruments = new Set<string>();
  for (const g of genres) {
    const hint = GENRE_INSTRUMENTS[g];
    if (hint && !addedInstruments.has(hint)) {
      tags.push(hint);
      addedInstruments.add(hint);
    }
  }

  // 4. Tempo (cleaned up)
  if (brief.tempo) {
    tags.push(brief.tempo.replace('BPM', 'bpm').replace('–', '-').replace('—', '-'));
  }

  // 5. Key (first phrase only, lowercase)
  if (brief.key) {
    const keyPhrase = brief.key.split(/[;]/)[0].trim().toLowerCase();
    if (keyPhrase.length < 55) tags.push(keyPhrase);
  }

  // 6. Direction: short positive descriptors only
  extractDirectionTags(brief.direction).forEach(t => tags.push(t));

  // 7. References: "in the style of Artist, Artist"
  if (brief.references.length > 0) {
    const artists = brief.references
      .map(r => r.track.split(/[,–—]/)[0].trim())
      .filter(Boolean);
    if (artists.length > 0) tags.push(`in the style of ${artists.join(', ')}`);
  }

  // 8. Vocal type
  const isVocal = brief.vocals?.toLowerCase().includes('vocal') &&
    !brief.vocals?.toLowerCase().includes('instrumental');
  tags.push(isVocal ? 'with vocals' : 'no vocals, instrumental');

  return tags.filter(Boolean).join(', ');
}

export default function SunoPromptModal({ brief }: { brief: Brief }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const stylePrompt = buildStylePrompt(brief);

  function copyStyle() {
    navigator.clipboard.writeText(stylePrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        ◆ AI Prompt
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10, 9, 8, 0.82)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '2px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-card)]">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ◆ AI Music Prompt
                </div>
                <div className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Project {brief.codename} · Suno / Udio
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none px-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Style — paste into Suno&apos;s Style field. Leave lyrics blank.
                </div>
                <button
                  onClick={copyStyle}
                  className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors shrink-0 ml-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
              <pre
                className="text-sm leading-relaxed p-4 whitespace-pre-wrap break-words select-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '2px',
                  color: 'var(--text-primary)',
                }}
              >
                {stylePrompt}
              </pre>
            </div>

            <div className="px-6 pb-5">
              <p className="text-[10px] text-[var(--text-dimmer)] leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Paste this into Suno&apos;s &quot;Style of Music&quot; box only. Leave the lyrics field empty — Suno will generate an instrumental based on the style tags alone.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
