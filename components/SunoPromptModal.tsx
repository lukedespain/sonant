'use client';

import { useState } from 'react';
import type { Brief } from './BriefDocument';

function buildStylePrompt(brief: Brief): string {
  const isVocal = brief.deliverables?.some(d =>
    d.toLowerCase().includes('cappella') || d.toLowerCase().includes(' inst')
  );

  const parts: string[] = [];

  // Core genre and mood
  if (brief.genrePalette) parts.push(brief.genrePalette);
  if (brief.emotionalArc) parts.push(brief.emotionalArc);

  // Tempo and key
  if (brief.tempo) parts.push(brief.tempo);
  if (brief.key) parts.push(brief.key);

  // Up to 3 sonic direction points (condensed to first sentence each)
  brief.direction.slice(0, 3).forEach(d => {
    const condensed = d.split('.')[0].trim();
    if (condensed) parts.push(condensed);
  });

  // Avoid keywords — use legacy avoid array if present, otherwise from references
  if (brief.avoid && brief.avoid.length > 0) {
    const avoidSnippets = brief.avoid
      .slice(0, 3)
      .map(a => a.split('.')[0].replace(/^avoid\s+/i, '').trim())
      .join(', ');
    parts.push(`Avoid: ${avoidSnippets}`);
  }

  // Reference artists only (not full track titles)
  if (brief.references.length > 0) {
    const artists = brief.references
      .map(r => r.track.split(/\s[–—-]\s/)[0].trim())
      .join(', ');
    parts.push(`Reference energy: ${artists}`);
  }

  parts.push(isVocal ? 'with vocals' : 'instrumental');

  return parts.filter(Boolean).join(', ');
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
