import { Suspense } from 'react';
import { requireSiteAdmin } from '@/lib/admin';
import AdminTabs from './AdminTabs';
import SubmissionsTab from './SubmissionsTab';
import BriefsTab from './BriefsTab';
import PeopleTab from './PeopleTab';
import HouseDigestTab from './HouseDigestTab';
import UsageMeters from './UsageMeters';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; queue?: string; kind?: string }>;
}) {
  await requireSiteAdmin();
  const { tab, queue, kind } = await searchParams;
  const active =
    tab === 'briefs' || tab === 'people' || tab === 'houses' ? tab : 'submissions';
  const submissionQueue = queue === 'client' ? 'client' : 'catalog';
  const briefKind = kind === 'catalog' ? 'catalog' : 'client';

  return (
    <div className="flex-1 min-w-0 pt-12 md:pt-16 pb-24">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        <h1 className="font-serif font-light tracking-tight text-4xl md:text-5xl mb-8">Admin.</h1>

        <Suspense fallback={null}>
          <AdminTabs />
        </Suspense>

        {active === 'briefs' ? (
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
