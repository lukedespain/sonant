import type { ReactNode } from 'react';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: 'What is this?',
    a: 'The composer side of Thought Collective. We post briefs for the tracks our clients keep asking for, you write to them, and the strongest submissions go into our catalogue. Composers with a track in the catalogue join our roster and get invited to paid client projects.',
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
    a: 'Your track goes privately to our team, and you can follow its status in Submissions. We cannot promise to reply to every submission, but if yours is picked for the catalogue, we email you straight away. Catalogue briefs get a decision, not written notes. Client projects are where we work closely with you, with notes and back and forth.',
  },
  {
    q: 'What are the terms if my track is accepted?',
    a: 'Exclusive to the Thought Collective catalogue, with sync fees split 50/50. We pitch it to agencies and brands. You sign on from your Dashboard with your PRO and IPI details and a link to the stems.',
  },
  {
    q: 'What is the roster, and what are projects?',
    a: 'Every composer with a track in our catalogue. Your first accepted track puts you on it, tagged for the genres and moods that track nails. When a client project needs that sound, we invite you to it, and it shows up in your Projects.',
  },
  {
    q: 'Can I use AI?',
    a: 'No. The catalogue is human-made only: no AI-generated music, stems, or vocals. You confirm it when you sign on.',
  },
  {
    q: 'Does it cost anything?',
    a: 'No. Joining and submitting are free. Send your best track for any brief that fits you.',
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
