import { requireSiteAdmin } from '@/lib/admin';
import SubmissionsTab from './SubmissionsTab';
import BriefsTab from './BriefsTab';
import PeopleTab from './PeopleTab';
import HouseDigestTab from './HouseDigestTab';
import UsageMeters from './UsageMeters';
import RosterView from './RosterView';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadRoster } from '@/lib/roster';
import { AppHeader, AppPage } from '@/components/ui';

const HEADERS = {
  submissions: {
    title: 'Review queue',
    description: 'Listen, write notes, and make the call. Every decision emails the composer with your notes.',
  },
  roster: {
    title: 'Roster',
    description: 'Composers with a placement, tagged by the genres and moods their tracks nail. Pick people for brand jobs here.',
  },
  briefs: {
    title: 'Write briefs',
    description: 'Create catalogue briefs for the open board, or paid client briefs for the roster.',
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
    tab === 'briefs' || tab === 'people' || tab === 'houses' || tab === 'roster' ? tab : 'submissions';
  const submissionQueue = queue === 'client' ? 'client' : 'catalog';
  const briefKind = kind === 'catalog' ? 'catalog' : 'client';
  const header = HEADERS[active];

  return (
    <AppPage width={active === 'briefs' || active === 'houses' ? 'narrow' : 'wide'}>
      <AppHeader eyebrow="Admin" title={header.title} description={header.description} />

      {active === 'roster' ? (
        <RosterView composers={await loadRoster(createAdminClient())} />
      ) : active === 'briefs' ? (
        <BriefsTab kind={briefKind} />
      ) : active === 'houses' ? (
        <HouseDigestTab />
      ) : active === 'people' ? (
        <PeopleTab />
      ) : (
        <SubmissionsTab queue={submissionQueue} />
      )}

      <UsageMeters />
    </AppPage>
  );
}
