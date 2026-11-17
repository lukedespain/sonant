import type { ReactNode } from 'react';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: 'What happens after I submit?',
    a: 'Your track goes privately to our team. Follow it in Submissions. If it is accepted, we email you.',
  },
  {
    q: 'What are the terms if my track is accepted?',
    a: 'Exclusive to our catalogue, with sync fees split 50/50. We pitch it to agencies and brands. You confirm the terms, your PRO and IPI, and send stems.',
  },
  {
    q: 'How do I get invited to projects?',
    a: 'Get a track accepted. You join our roster, tagged for the genres and moods it nails, and we invite you when a client needs that sound.',
  },
  {
    q: 'Can I use AI?',
    a: 'No. Every track is human-made: no AI-generated music, stems, or vocals.',
  },
  {
    q: 'Does it cost anything?',
    a: 'No. Joining and submitting are free.',
  },
  {
    q: 'Who is Thought Collective?',
    a: (
      <>
        A London music and sound company making music for advertising, film, and TV.{' '}
        <a href={THOUGHT_COLLECTIVE_SITE} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:opacity-70">
          See our work
        </a>
        .
      </>
    ),
  },
];

export default function AboutQuestions() {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
      {QUESTIONS.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex items-center justify-between gap-6 px-5 md:px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-[var(--bg-card-hover)] transition-colors">
            <span className="text-[15px] font-medium tracking-[-0.01em] text-[var(--text-secondary)] group-open:text-[var(--text-primary)] transition-colors">
              {item.q}
            </span>
            <span
              className="shrink-0 w-6 h-6 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-dim)] group-open:rotate-45 group-open:text-[var(--text-primary)] transition-transform text-[15px] leading-none"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="px-5 md:px-6 pb-5 -mt-1 pr-14 text-[14px] text-[var(--text-muted)] leading-relaxed max-w-3xl">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
