import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadCatalogueBriefs } from '@/lib/tc-briefs';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';
import { readRights, validateRights } from '@/lib/handoff';
import { readSound, soundMatches } from '@/lib/sound';
import BriefGrid from '@/components/BriefGrid';
import AboutQuestions from '@/components/AboutQuestions';
import { AppPage, btn } from '@/components/ui';
import { IconArrowUpRight } from '@/components/shell/icons';

const STEPS = [
  { title: 'Set up your profile', body: 'Your PRO and IPI, so we can register and pay you.' },
  { title: 'Write to a brief', body: 'Pick one that fits your sound and submit your track.' },
  { title: 'Get accepted', body: 'The best tracks join our catalogue, and we pitch them to brands.' },
  { title: 'Get invited to projects', body: 'Paid client work in your lane, with notes from our team.' },
];

const DEAL = [
  { label: 'If accepted', value: 'Exclusive to our catalogue' },
  { label: 'Sync fees', value: 'Split 50/50' },
  { label: 'Every track', value: 'Human-made, no AI' },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sound = user ? readSound(user.user_metadata) : null;
  const profileReady = user ? validateRights(readRights(user.user_metadata)) === null : true;

  const all = await loadCatalogueBriefs(createAdminClient());
  const scored = all.map((b) => ({ ...b, fit: sound ? soundMatches(sound, b) : [] }));
  const hasSound = !!sound && sound.genres.length + sound.moods.length > 0;
  const picks = (hasSound ? [...scored].sort((a, b) => b.fit.length - a.fit.length) : scored).slice(0, 3);

  return (
    <AppPage>
      <section className="max-w-3xl pt-2 md:pt-6">
        <p className="text-[13px] font-medium text-[var(--signal)]">Thought Collective composer portal</p>
        <h1 className="mt-4 text-[40px] md:text-[60px] font-semibold tracking-[-0.04em] leading-[1.02] text-balance">
          Write to our briefs. Join our roster.
        </h1>
        <p className="mt-5 text-[17px] md:text-[18px] text-[var(--text-muted)] leading-relaxed">
          We make music for brands, film, and TV. The best tracks written to our briefs join our catalogue.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/briefs" className={btn('primary', 'lg')}>
            Browse briefs
          </Link>
          {!user && (
            <Link href="/signup" className={btn('secondary', 'lg')}>
              Create a free account
            </Link>
          )}
        </div>
      </section>

      {user && !profileReady && (
        <section className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[var(--signal-line)] bg-[var(--signal-soft)] px-5 py-4">
          <p className="flex-1 text-[15px]">Finish your profile before your first submission. It takes two minutes.</p>
          <Link href="/dashboard?tab=profile#rights" className={btn('accent', 'md', 'shrink-0')}>
            Finish profile
          </Link>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] mb-5">How it works</h2>
        <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 md:p-6 flex flex-col gap-2.5">
              <span className="text-[13px] text-[var(--text-dim)] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[17px] font-semibold tracking-[-0.02em]">{step.title}</span>
              <span className="text-[14px] text-[var(--text-muted)] leading-relaxed">{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-3 grid sm:grid-cols-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-base)]">
        {DEAL.map((d) => (
          <div key={d.label} className="px-5 md:px-6 py-4">
            <p className="text-[13px] text-[var(--text-dim)]">{d.label}</p>
            <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">{d.value}</p>
          </div>
        ))}
      </section>

      {picks.length > 0 && (
        <section className="mt-14">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{hasSound ? 'Briefs for your sound' : 'Open briefs'}</h2>
            <Link href="/briefs" className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              All briefs →
            </Link>
          </div>
          <BriefGrid briefs={picks} showTabs={false} />
        </section>
      )}

      <section id="faq" className="mt-14 scroll-mt-20">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] mb-5">Frequently asked questions</h2>
        <AboutQuestions />
      </section>

      <footer className="mt-14 pt-6 border-t border-[var(--border-base)] flex flex-wrap items-center justify-between gap-4 text-[13px] text-[var(--text-muted)]">
        <a href="mailto:hello@thoughtcollective.com" className="hover:text-[var(--text-primary)]">
          hello@thoughtcollective.com
        </a>
        <a href={THOUGHT_COLLECTIVE_SITE} className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]">
          Thought Collective main site <IconArrowUpRight size={12} />
        </a>
      </footer>
    </AppPage>
  );
}
