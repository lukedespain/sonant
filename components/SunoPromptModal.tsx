'use client';

import { useState } from 'react';
import type { Brief } from './BriefDocument';

function buildSunoPrompt(brief: Brief): { styleTags: string; description: string } {
  const isVocal = brief.deliverables?.some(d =>
    d.toLowerCase().includes('cappella') || d.toLowerCase().includes(' inst')
  );

  const styleTags = [
    brief.genrePalette,
    brief.emotionalArc,
    brief.tempo,
    brief.key,
    isVocal ? 'vocal' : 'instrumental',
  ].filter(Boolean).join(', ');

  const directionBlock = brief.direction
    .slice(0, 4)
    .map(d => `• ${d.trim()}`)
    .join('\n');

  const avoidBlock = brief.avoid.length > 0
    ? `\nAvoid: ${brief.avoid.join(' | ')}`
    : '';

  const refBlock = brief.references.length > 0
    ? `\nReference energy (style only, not imitation): ${brief.references.map(r => r.track).join(', ')}`
    : '';

  const description = [
    brief.ask,
    '',
    directionBlock,
    avoidBlock,
    refBlock,
  ].filter(s => s !== undefined).join('\n').trim();

  return { styleTags, description };
}

export default function SunoPromptModal({ brief }: { brief: Brief }) {
  const [open, setOpen] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const { styleTags, description } = buildSunoPrompt(brief);

  function copyText(text: string, which: 'style' | 'desc') {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'style') {
        setCopiedStyle(true);
        setTimeout(() => setCopiedStyle(false), 1800);
      } else {
        setCopiedDesc(true);
        setTimeout(() => setCopiedDesc(false), 1800);
      }
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
                  Project {brief.codename} · optimized for Suno / Udio
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

            <div className="px-6 py-5 space-y-6">
              {/* Style Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Style Tags — paste into Suno&apos;s Style field
                  </div>
                  <button
                    onClick={() => copyText(styleTags, 'style')}
                    className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    {copiedStyle ? '✓ Copied' : '⎘ Copy'}
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
                  {styleTags}
                </pre>
              </div>

              {/* Description Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Description — paste into Suno&apos;s Lyrics / Description field
                  </div>
                  <button
                    onClick={() => copyText(description, 'desc')}
                    className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                  >
                    {copiedDesc ? '✓ Copied' : '⎘ Copy'}
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
                  {description}
                </pre>
              </div>
            </div>

            <div className="px-6 pb-5">
              <p className="text-[10px] text-[var(--text-dimmer)] leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Style Tags goes in Suno&apos;s &quot;Style of Music&quot; box. Description goes in the lyrics/description area with &quot;Instrumental&quot; or leave blank for Suno to generate vocals.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
