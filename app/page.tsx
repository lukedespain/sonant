import Link from 'next/link';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadCatalogueBriefs } from '@/lib/tc-briefs';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';
import BriefGrid from '@/components/BriefGrid';
import AboutQuestions from '@/components/AboutQuestions';
import { AppPage, SectionHeader, btn } from '@/components/ui';
import { IconArrowUpRight, IconBriefs, IconFolder, IconUser, IconWaveform } from '@/components/shell/icons';

const PARTS: { icon: (p: { size?: number }) => ReactNode; title: string; href: string; who: string; body: string }[] = [
  {
    icon: IconBriefs,
    title: 'Briefs',
    href: '/briefs',
    who: 'Open to everyone',
    body: 'The tracks our clients keep asking for, written up as briefs for the Thought Collective catalogue. Pick one, download it, write to it, and submit. One free submission a week, and unused ones stack.',
  },
  {
    icon: IconFolder,
    title: 'Projects',
    href: '/projects',
    who: 'Roster composers',
    body: 'Custom work for brands and agencies. Get a track accepted and you join the roster, tagged for the genres and moods it nails. When a client needs that sound, we invite you to the project: upload versions, get notes from our team, and turn it around fast.',
  },
  {
    icon: IconWaveform,
    title: 'Submissions',
    href: '/dashboard',
    who: 'Your dashboard',
    body: 'Every track you have sent us and where it stands: in review, shortlisted, accepted, or not this time. When a track is accepted, you sign on from here.',
  },
  {
    icon: IconUser,
    title: 'Profile',
    href: '/dashboard?tab=profile',
    who: 'Fill it in once',
    body: 'Your PRO, IPI, and publisher, so we can register your music and pay you the moment a track is accepted. Plus your name, email, and password.',
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const briefs = await loadCatalogueBriefs(createAdminClient());

  return (
    <AppPage>
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[radial-gradient(90%_120%_at_100%_0%,var(--signal-soft),transparent_55%),var(--bg-card)] px-6 py-10 md:px-12 md:py-16">
        <p className="text-[13px] text-[var(--signal)] font-medium">Thought Collective · Composer portal</p>
        <h1 className="mt-4 text-[38px] md:text-[60px] font-semibold tracking-[-0.04em] leading-[1.02] max-w-[14ch] text-balance">
          Write music for the brands we work with
        </h1>
        <p className="mt-5 text-[16px] md:text-[18px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Thought Collective is a London music and sound company making music for advertising, film, and television, with a
          boutique catalogue alongside. This is where composers find our briefs, work on client projects with our team, and keep
          track of everything they send us.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/briefs" className={btn('primary', 'lg')}>
            Browse briefs
          </Link>
          {user ? (
            <Link href="/dashboard" className={btn('secondary', 'lg')}>
              My submissions
            </Link>
          ) : (
            <Link href="/signup" className={btn('secondary', 'lg')}>
              Create a free account
            </Link>
          )}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeader title="How the portal works" description="Four places, in the order you will use them." />
        <ol className="grid sm:grid-cols-2 gap-3">
          {PARTS.map((part, i) => (
            <li key={part.title}>
              <Link
                href={part.href}
                className="group flex flex-col h-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 md:p-6 transition-colors hover:border-[var(--border-hover)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--signal)]">
                      <part.icon size={17} />
                    </span>
                    <span>
                      <span className="block text-[17px] font-semibold tracking-[-0.02em]">
                        <span className="text-[var(--text-dimmer)] tabular-nums mr-2">{i + 1}</span>
                        {part.title}
                      </span>
                      <span className="block text-[12px] text-[var(--text-dim)]">{part.who}</span>
                    </span>
                  </span>
                  <span className="text-[var(--text-dimmer)] group-hover:text-[var(--text-primary)] transition-colors">
                    <IconArrowUpRight size={15} />
                  </span>
                </div>
                <p className="mt-4 text-[14px] text-[var(--text-muted)] leading-relaxed">{part.body}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {briefs.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            title="Open briefs"
            actions={
              <Link href="/briefs" className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                All briefs →
              </Link>
            }
          />
          <BriefGrid briefs={briefs.slice(0, 3)} showTabs={false} />
        </section>
      )}

      <section id="faq" className="mt-14 scroll-mt-20">
        <SectionHeader title="Questions" description="The short version of how everything works." />
        <AboutQuestions />
      </section>

      <section className="mt-14 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em]">Looking for the main Thought Collective site?</p>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">
            Our work for brands, our team, and how to hire us. Questions about the portal:{' '}
            <a href="mailto:hello@thoughtcollective.com" className="text-[var(--text-primary)] hover:text-[var(--signal)]">
              hello@thoughtcollective.com
            </a>
          </p>
        </div>
        <a href={THOUGHT_COLLECTIVE_SITE} className={btn('secondary', 'lg', 'shrink-0')}>
          Go to the main site <IconArrowUpRight size={14} />
        </a>
      </section>
    </AppPage>
  );
}
