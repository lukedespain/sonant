'use client';

import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'What is Sonant?',
    a: 'A platform for sync composers to practice writing to spec for brands, films and games. Three pages: the Generator, the Library, and the Catalog. The point is to build a catalog worth pitching.',
  },
  {
    q: 'What is the Generator?',
    a: 'A brief builder for practice on demand. You pick type, category, mood, and genre, and it writes a full creative brief the way a supervisor would: scene, instrumentation, references. No client required. Just reps.',
  },
  {
    q: 'What is the Library?',
    a: 'The briefs you write to. Practice briefs anyone can take, and paid opportunities for brands, films and games once you have three placements. Anyone can write to practice briefs. Paid jobs stay behind the verified badge.',
  },
  {
    q: 'What is the Catalog?',
    a: 'Your submitted work over time: tracks, written notes, and placements. Strong tracks get placed and pitched. Three placements unlock paid briefs in the Library. The catalog is the thing you are building.',
  },
  {
    q: 'Do I need an account?',
    a: 'Anyone can use the Generator without signing up. An account is required to save briefs or submit from the Library. Creating one is free, and every account includes one submission credit each month.',
  },
  {
    q: 'How do submission credits work?',
    a: 'Each submission from the Library costs one credit. Free accounts include one credit per month. Extra credits are $10 each from your profile.',
  },
  {
    q: 'How do I access paid opportunities?',
    a: 'They live in the Library under Paid. Three catalog placements earn you access, so we know what you are good at and which jobs to send you.',
  },
  {
    q: 'What kind of feedback do I get?',
    a: 'Every Catalog submission gets written notes, whether the track is accepted or not. The notes are tied to the brief you wrote to, so they stay specific.',
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
