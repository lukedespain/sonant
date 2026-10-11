import type { ReactNode } from 'react';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: 'What is Sonant?',
    a: 'A place for sync composers to practice writing to spec, get written feedback, and get music into catalogs that pitch it to brands, film, and games.',
  },
  {
    q: 'What are the different briefs?',
    a: 'Practice briefs are for reps, and anyone can write to them. Catalog briefs come from music houses looking for specific tracks, and that is where you submit. Paid client briefs open up for verified composers.',
  },
  {
    q: 'What feedback do I get?',
    a: 'Every catalog submission gets written feedback on the track, whether it goes to the catalog or not. It is tied to the brief you wrote to, so it stays specific.',
  },
  {
    q: 'What happens after I submit?',
    a: 'Every track gets listened to against the brief, and you get written feedback by email and in your Dashboard. The strongest go to the catalog, and they make the final call, usually within a week.',
  },
  {
    q: 'What are the terms if my track places?',
    a: 'Each catalog lists its deal on the Catalogs page. Thought Collective is exclusive with a 50/50 split on sync fees. The Sonant catalog is non-exclusive, also 50/50, so you can pitch the track anywhere else too.',
  },
  {
    q: 'Who are the catalogs?',
    a: (
      <>
        Right now, <a href={THOUGHT_COLLECTIVE_SITE} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:opacity-70">Thought Collective</a>, a brand-focused catalog, and the Sonant catalog. Each one lists its deal and split on the Catalogs page.
      </>
    ),
  },
  {
    q: 'How do submission credits work?',
    a: 'Each submission costs one credit. Every free account gets one credit a month, and extra credits are $10 each from your Dashboard.',
  },
  {
    q: 'How do I get paid client briefs?',
    a: 'Get three tracks accepted into a catalog. That earns the verified badge, and paid client briefs show up at the top of Briefs. We email you when a new one lands.',
  },
  {
    q: 'Do I need an account?',
    a: 'Not to try the Generator. You need a free account to save briefs and submit tracks.',
  },
];

export default function AboutQuestions() {
  return (
    <div className="border-t border-[var(--border-base)]">
      {QUESTIONS.map((item) => (
        <details key={item.q} className="group border-b border-[var(--border-base)]">
          <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-lg md:text-xl tracking-tight text-[var(--text-secondary)] group-open:text-[var(--text-primary)] transition-colors">
              {item.q}
            </span>
            <span
              className="shrink-0 text-[var(--text-dimmer)] group-open:text-[var(--accent)] transition-transform group-open:rotate-45 text-xl leading-none"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="pb-6 pr-10 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
