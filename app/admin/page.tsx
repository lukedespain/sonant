import { Suspense } from 'react';
import { requireSiteAdmin } from '@/lib/admin';
import AdminTabs from './AdminTabs';
import SubmissionsTab from './SubmissionsTab';
import BriefsTab from './BriefsTab';
import PeopleTab from './PeopleTab';
import HouseDigestTab from './HouseDigestTab';
import UsageMeters from './UsageMeters';
import RosterView from './RosterView';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadRoster } from '@/lib/roster';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; queue?: string; kind?: string }>;
}) {
  await requireSiteAdmin();
  const { tab, queue, kind } = await searchParams;
  const active =
    tab === 'briefs' || tab === 'people' || tab === 'houses' || tab === 'roster' ? tab : 'submissions';
  const submissionQueue = queue === 'client' ? 'client' : 'catalog';
  const briefKind = kind === 'catalog' ? 'catalog' : 'client';

  return (
    <div className="flex-1 min-w-0 pt-12 md:pt-16 pb-24">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[60px]">
        <h1 className="display-title mb-10">Admin</h1>

        <Suspense fallback={null}>
          <AdminTabs />
        </Suspense>

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
      </div>
    </div>
  );
}
