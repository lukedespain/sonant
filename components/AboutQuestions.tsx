import type { ReactNode } from 'react';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: 'What is this?',
    a: 'The composer side of Thought Collective. We post briefs for the tracks our clients keep asking for, you write to them, and the strongest submissions go into our catalogue.',
  },
  {
    q: 'Who is Thought Collective?',
    a: (
      <>
        A London music and sound company. We make original music and sound for advertising, film, and television, and run a boutique catalogue alongside. See our work at{' '}
        <a href={THOUGHT_COLLECTIVE_SITE} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:opacity-70">
          wearethoughtcollective.com
        </a>
        .
      </>
    ),
  },
  {
    q: 'What happens after I submit?',
    a: 'We listen to every track against the brief and send written feedback by email and in your Dashboard, whether it goes into the catalogue or not.',
  },
  {
    q: 'What are the terms if my track is accepted?',
    a: 'Exclusive to the Thought Collective catalogue, with sync fees split 50/50. We pitch it to agencies and brands. You sign on from your Dashboard with your PRO and IPI details and a link to the stems.',
  },
  {
    q: 'What is the roster?',
    a: 'Composers with a track in our catalogue. When a brand job needs custom music, the roster is who we call first, matched on the genres and moods we have already placed from you. After three placements, paid client briefs open up here too.',
  },
  {
    q: 'Can I use AI?',
    a: 'No. The catalogue is human-made only: no AI-generated music, stems, or vocals. You confirm it when you sign on.',
  },
  {
    q: 'How do submissions work?',
    a: 'Each submission uses one credit. Every account gets one free credit a month, and extra credits are $10 each from your Dashboard.',
  },
];

export default function AboutQuestions() {
  return (
    <div className="border-t border-[var(--border-base)]">
      {QUESTIONS.map((item) => (
        <details key={item.q} className="group border-b border-[var(--border-base)]">
          <summary className="flex items-center justify-between gap-6 py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="text-[21px] md:text-[24px] font-medium tracking-[-0.025em] text-[var(--text-secondary)] group-open:text-[var(--text-primary)] transition-colors">
              {item.q}
            </span>
            <span
              className="shrink-0 text-[var(--text-dimmer)] group-open:text-[var(--text-primary)] transition-transform group-open:rotate-45 text-2xl leading-none font-light"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="pb-7 pr-10 text-[17px] text-[var(--text-muted)] leading-relaxed max-w-2xl">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
