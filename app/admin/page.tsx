import { requireSiteAdmin } from '@/lib/admin';
import SubmissionsTab from './SubmissionsTab';
import BriefsTab from './BriefsTab';
import PeopleTab from './PeopleTab';
import HouseDigestTab from './HouseDigestTab';
import UsageMeters from './UsageMeters';
import RosterView from './RosterView';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadRoster } from '@/lib/roster';
import { AppHeader, AppPage, SectionHeader, StatusPill } from '@/components/ui';
import Link from 'next/link';
import { loadProjects } from '@/lib/projects';

async function RecentProjects() {
  const projects = (await loadProjects(createAdminClient())).slice(0, 8);
  if (projects.length === 0) return null;
  return (
    <section className="mt-14">
      <SectionHeader
        title="Projects"
        count={projects.length}
        actions={
          <Link href="/projects" className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            All projects →
          </Link>
        }
      />
      <ul className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="row-hover flex items-center justify-between gap-4 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-[14px] font-medium truncate">{p.title}</span>
                <span className="block text-[12px] text-[var(--text-dim)] truncate">
                  {[p.client, `${p.invites.length} invited`, p.deadline ? `Due ${p.deadline}` : null].filter(Boolean).join(' · ')}
                </span>
              </span>
              {p.closed ? <StatusPill tone="muted">Closed</StatusPill> : p.invites.length === 0 ? <StatusPill tone="warning">Invite composers</StatusPill> : <StatusPill tone="signal">Open</StatusPill>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const HEADERS = {
  submissions: {
    title: 'Review queue',
    description: 'Catalogue submissions waiting on a call. Accepting one puts the composer on the roster, tagged for what the track nails.',
  },
  roster: {
    title: 'Composer roster',
    description: 'Everyone with an account. Placed composers come first, tagged by the genres and moods their accepted tracks nail.',
  },
  briefs: {
    title: 'Create brief',
    description: 'A catalogue brief goes on the Briefs page for every composer. Star one there to feature it.',
  },
  projects: {
    title: 'Add project',
    description: 'Turn a client brief into a private project, then invite the roster composers who fit it.',
  },
  people: { title: 'People', description: 'Everyone with an account, newest first.' },
  houses: { title: 'Houses', description: 'Send a music house a curated note with your Disco playlist.' },
} as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; queue?: string; kind?: string }>;
}) {
  await requireSiteAdmin();
  const { tab, queue, kind } = await searchParams;
  const active: keyof typeof HEADERS =
    tab === 'briefs' || tab === 'projects' || tab === 'people' || tab === 'houses' || tab === 'roster' ? tab : 'submissions';
  void queue;
  void kind;
  const header = HEADERS[active];

  return (
    <AppPage width={active === 'briefs' || active === 'houses' || active === 'projects' ? 'narrow' : 'wide'}>
      <AppHeader eyebrow="Admin" title={header.title} description={header.description} />

      {active === 'roster' ? (
        <RosterView composers={await loadRoster(createAdminClient())} />
      ) : active === 'briefs' ? (
        <BriefsTab kind="catalog" />
      ) : active === 'projects' ? (
        <>
          <BriefsTab kind="client" />
          <RecentProjects />
        </>
      ) : active === 'houses' ? (
        <HouseDigestTab />
      ) : active === 'people' ? (
        <PeopleTab />
      ) : (
        <SubmissionsTab queue="catalog" />
      )}

      <UsageMeters />
    </AppPage>
  );
}
