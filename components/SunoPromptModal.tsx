'use client';

import { useState } from 'react';
import type { Brief } from './BriefDocument';

// Individual instrument tags per genre — no multi-item strings
const GENRE_INSTRUMENTS: Record<string, string[]> = {
  'ambient':        ['synth pads', 'drones'],
  'orchestral':     ['strings', 'orchestra'],
  'neo-classical':  ['piano', 'chamber strings'],
  'folk / acoustic':['acoustic guitar', 'fingerpicked'],
  'folk/acoustic':  ['acoustic guitar', 'fingerpicked'],
  'folk':           ['acoustic guitar', 'fingerpicked'],
  'acoustic':       ['acoustic guitar'],
  'jazz':           ['jazz piano', 'upright bass', 'brushed drums'],
  'hip-hop':        ['sampled drums', 'lo-fi'],
  'electronic':     ['synthesizer', 'drum machine'],
  'rock':           ['electric guitar', 'live drums'],
  'cinematic':      ['cinematic strings', 'film score'],
  'r&b / soul':     ['warm bass', 'soul chords'],
  'r&b':            ['warm bass', 'soul chords'],
  'soul':           ['soul chords', 'warm bass'],
  'indie':          ['layered guitars', 'indie drums'],
  'country':        ['acoustic guitar', 'pedal steel'],
  'alternative':    ['electric guitar', 'indie drums'],
  'pop':            ['pop production', 'melodic hooks'],
  'classical':      ['piano', 'strings'],
  'blues':          ['electric guitar', 'blues harp'],
};

// Extract 1-3 word mood descriptors from the emotional arc sentence
function extractMoodTags(arc: string): string[] {
  const STRIP_LEAD = /^(begins?\s+|starts?\s+|opens?\s+(into\s+)?|resolves?\s+(to\s+)?|builds?\s+(into\s+)?|holds?\s+|shifts?\s+(to\s+)?|transitions?\s+(into\s+)?|moves?\s+(to\s+)?|maintains?\s+|ends?\s+(in\s+)?)/i;
  const STRIP_PREP = /^(into|toward|to|with|in|through|a sense of|the feeling of|sense of)\s+/i;

  return arc
    .split(/[,;]/)
    .map(part => {
      let s = part.trim().toLowerCase();
      s = s.replace(STRIP_LEAD, '');
      s = s.replace(STRIP_PREP, '');
      return s.split(/\s+/).slice(0, 3).join(' ').trim();
    })
    .filter(t => t.length >= 3 && !/^(and|but|the|a |an |that|this|with|into)/.test(t))
    .slice(0, 4);
}

// Extract BPM range and tempo word as separate tags
function extractTempoTags(tempo: string): string[] {
  const tags: string[] = [];
  const desc = tempo.match(/\b(slow|medium|fast|moderate|up-tempo|uptempo|mid-tempo)\b/i);
  if (desc) tags.push(desc[0].toLowerCase());
  const bpm = tempo.match(/(\d+)[^\d]*(\d+)?\s*bpm/i);
  if (bpm) tags.push(bpm[2] ? `${bpm[1]}-${bpm[2]} bpm` : `${bpm[1]} bpm`);
  return tags;
}

// Extract just the key signature (e.g. "D minor", "modal", "Dorian")
function extractKeyTag(key: string): string[] {
  const match = key.match(/([A-G][b#]?\s+)?(minor|major|modal|dorian|mixolydian|phrygian|lydian|aeolian|pentatonic)/i);
  if (match) return [match[0].trim().toLowerCase()];
  const simple = key.match(/\b(minor|major|modal|dorian|mixolydian)\b/i);
  return simple ? [simple[0].toLowerCase()] : [];
}

// Pull 1-4 word positive descriptors from direction lines — skip all instructional sentences
function extractDirectionTags(direction: string[]): string[] {
  const SKIP = /^(think|avoid|lean|use |build |keep |let |make |create |try |write |consider |explore |focus |leave |stay |push |pull |don't|do not|ensure|if |the track|your track|this track|note |be )/i;
  const tags: string[] = [];

  for (const d of direction.slice(0, 6)) {
    const trimmed = d.trim();
    if (SKIP.test(trimmed)) continue;
    const clause = trimmed.split(/[.,;:]/)[0].trim().toLowerCase();
    const words = clause.split(/\s+/).slice(0, 4);
    // Only include if it reads as a descriptor (≤4 words, no verb at start)
    if (words.length >= 1 && words.length <= 4 && !/^(is|are|has|have|was|were|will|should|must|can|could|would)\b/.test(words[0])) {
      tags.push(words.join(' '));
    }
  }
  return [...new Set(tags)];
}

function buildStylePrompt(brief: Brief): string {
  const tags: string[] = [];

  // 1. Genre tags
  brief.genrePalette
    .split(/[,/]/)
    .map(g => g.trim().toLowerCase())
    .filter(Boolean)
    .forEach(g => tags.push(g));

  // 2. Mood tags (extracted from emotional arc — words only, no sentences)
  extractMoodTags(brief.emotionalArc).forEach(m => tags.push(m));

  // 3. Instrument tags (individual tags per genre, max 2 per genre)
  const genres = brief.genrePalette.split(/[,/]/).map(g => g.trim().toLowerCase());
  const seen = new Set<string>();
  for (const g of genres) {
    for (const hint of (GENRE_INSTRUMENTS[g] ?? []).slice(0, 2)) {
      if (!seen.has(hint)) { tags.push(hint); seen.add(hint); }
    }
  }

  // 4. Tempo (descriptor + BPM as separate tags)
  extractTempoTags(brief.tempo).forEach(t => tags.push(t));

  // 5. Key signature only
  extractKeyTag(brief.key).forEach(k => tags.push(k));

  // 6. Short direction descriptors (no artist names, no sentences)
  extractDirectionTags(brief.direction).forEach(t => tags.push(t));

  // NO artist/reference names — they confuse AI music generators

  // 7. Vocal type
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
