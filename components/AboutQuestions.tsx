'use client';

import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'What is Sonant?',
    a: 'A platform for composers who want to write music for brands, film, and games. Generate briefs written to real sync spec, practice writing to them, submit your best work, and get written feedback. Tracks that fit the catalog get placed and pitched to buyers.',
  },
  {
    q: 'Do I need an account?',
    a: 'Anyone can generate briefs without signing up. An account is required to save briefs, submit to catalog briefs, or book a feedback session. Creating one is free, and every account includes one submission credit each month.',
  },
  {
    q: 'What are catalog briefs?',
    a: 'Catalog briefs are the briefs composers submit tracks to, to try to get into the catalog. There are two kinds. Sonant briefs are curated by the team around what the catalog needs. Community briefs are written by composers. Submit to either. Every submission gets written feedback, and if the track is good enough, it goes in the catalog and we pitch it.',
  },
  {
    q: 'How do submission credits work?',
    a: 'Each submission to a catalog brief costs one credit. Free accounts include one credit per month. Additional credits can be purchased from your dashboard.',
  },
  {
    q: 'What are client briefs?',
    a: 'Client briefs are real paid jobs from brands, studios, and supervisors in the Sonant network. They stay in a closed network, they pay, and they come with a quick deadline. They don\'t go out to everyone.',
  },
  {
    q: 'How do I access paid client briefs?',
    a: 'Real client briefs stay in a closed network. They don\'t go out to everyone. Three catalog placements earn you access, so we know what you\'re good at and which jobs to send you.',
  },
  {
    q: 'How do feedback sessions work?',
    a: 'A 45-minute session. We listen to your track together, compare it against the brief, and give you specific notes in real time. Good before you submit, after written feedback, or when a mix has been open too long. Sessions are $50.',
  },
] as const;

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

export default function AboutQuestions() {
  const [active, setActive] = useState(0);
  const current = QUESTIONS[active];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 md:gap-16 items-start">
      <div className="border-t border-[var(--border-base)]">
        {QUESTIONS.map((item, i) => {
          const selected = i === active;
          return (
            <div key={item.q} className="border-b border-[var(--border-base)]">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={selected}
                className={`w-full text-left py-4 md:py-5 transition-colors ${
                  selected
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-dimmer)] hover:text-[var(--text-secondary)]'
                }`}
                style={{ ...serif, fontWeight: 400 }}
              >
                <span className="flex items-baseline gap-4">
                  <span
                    className={`text-[10px] tabular-nums tracking-widest ${
                      selected ? 'text-[#E85D2F]' : 'text-[var(--text-dimmer)]'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base md:text-lg leading-snug">{item.q}</span>
                </span>
              </button>
              {selected && (
                <p
                  className="md:hidden pb-5 pl-9 text-sm text-[var(--text-muted)] leading-relaxed"
                  style={sans}
                >
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block md:sticky md:top-28">
        <div
          className="text-[9px] tracking-[0.35em] uppercase text-[#E85D2F] mb-5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {String(active + 1).padStart(2, '0')}
        </div>
        <h3
          className="text-2xl lg:text-3xl tracking-tight leading-snug mb-6 text-[var(--text-primary)]"
          style={{ ...serif, fontWeight: 400 }}
        >
          {current.q}
        </h3>
        <p
          className="text-base text-[var(--text-muted)] leading-relaxed max-w-md"
          style={sans}
        >
          {current.a}
        </p>
      </div>
    </div>
  );
}
