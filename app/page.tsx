import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadCatalogueBriefs } from '@/lib/tc-briefs';
import BriefGrid from '@/components/BriefGrid';
import { btn } from '@/components/ui';

const STEPS = [
  {
    title: 'Write to a brief',
    body: 'Each brief is built from what agencies and brands are asking us for right now. Download it, write the track, and submit it here.',
  },
  {
    title: 'Get written feedback',
    body: 'Every submission is listened to against the brief and gets written notes, whether it makes the catalogue or not.',
  },
  {
    title: 'Join the roster',
    body: 'Accepted tracks go into the Thought Collective catalogue. Composers we place become the people we call first when a brand job needs custom music.',
  },
];

const wrap = 'max-w-[1440px] mx-auto px-5 md:px-[60px]';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const briefs = await loadCatalogueBriefs(createAdminClient());

  return (
    <div className="flex-1">
      <section className={`${wrap} pt-16 md:pt-28 pb-20 md:pb-32`}>
        <p className="text-[17px] text-[var(--text-muted)] mb-6 md:mb-8">For composers</p>
        <h1 className="display-title max-w-[11ch]">Write for Thought Collective</h1>
        <div className="mt-10 md:mt-14 grid md:grid-cols-2 gap-10 items-end">
          <p className="text-[19px] md:text-[21px] leading-[1.45] tracking-[-0.01em] text-[var(--text-secondary)] max-w-xl">
            We&apos;re a London music and sound company making music for advertising, film, and television, with a boutique catalogue alongside. These are the tracks our clients keep asking for.
          </p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/briefs" className={btn('primary', 'md')}>See the briefs</Link>
            {!user && (
              <Link href="/signup" className={btn('secondary', 'md')}>Create an account</Link>
            )}
          </div>
        </div>
      </section>

      {briefs.length > 0 && (
        <section className={`${wrap} pb-24 md:pb-36`}>
          <div className="flex items-baseline justify-between gap-6 mb-10">
            <h2 className="text-[34px] md:text-[48px] font-medium tracking-[-0.035em] leading-none">Open briefs</h2>
            <Link href="/briefs" className="text-[17px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              All briefs →
            </Link>
          </div>
          <BriefGrid briefs={briefs.slice(0, 3)} showTabs={false} />
        </section>
      )}

      <section className="border-t border-[var(--border-base)]">
        <div className={`${wrap} py-20 md:py-32`}>
          <h2 className="text-[34px] md:text-[48px] font-medium tracking-[-0.035em] leading-none mb-14">How it works</h2>
          <ol className="grid md:grid-cols-3 gap-12 md:gap-10">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <p className="text-[15px] text-[var(--text-dimmer)] tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-4 text-[24px] md:text-[28px] font-medium tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-3 text-[17px] text-[var(--text-muted)] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-20 text-[17px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Human-made only. Our clients ask for original music, so the catalogue takes no AI-generated music, stems, or vocals.
          </p>
        </div>
      </section>

      {!user && (
        <section className="border-t border-[var(--border-base)]">
          <div className={`${wrap} py-20 md:py-32 flex flex-col md:flex-row md:items-end justify-between gap-10`}>
            <h2 className="display-title max-w-[12ch]">Start with a brief</h2>
            <Link href="/signup" className={btn('primary', 'md')}>Create an account</Link>
          </div>
        </section>
      )}
    </div>
  );
}
