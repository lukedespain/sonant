import { Suspense } from 'react';
import { requireSiteAdmin } from '@/lib/admin';
import AdminTabs from './AdminTabs';
import SubmissionsTab from './SubmissionsTab';
import SessionsTab from './SessionsTab';
import BriefsTab from './BriefsTab';
import PeopleTab from './PeopleTab';
import UsageMeters from './UsageMeters';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; queue?: string }>;
}) {
  await requireSiteAdmin();
  const { tab, queue } = await searchParams;
  const active =
    tab === 'sessions' || tab === 'briefs' || tab === 'people' ? tab : 'submissions';
  const submissionQueue = queue === 'client' ? 'client' : 'catalog';

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Admin
        </div>

        <h1
          className="text-5xl md:text-6xl tracking-tight leading-tight mb-3"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Dashboard.
        </h1>

        <p
          className="text-base text-[var(--text-tertiary)] mb-8 max-w-xl"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Catalog review, upcoming sessions, paid client briefs, and composer accounts.
        </p>

        <UsageMeters />

        <Suspense fallback={null}>
          <AdminTabs />
        </Suspense>

        {active === 'sessions' ? (
          <SessionsTab />
        ) : active === 'briefs' ? (
          <BriefsTab />
        ) : active === 'people' ? (
          <PeopleTab />
        ) : (
          <SubmissionsTab queue={submissionQueue} />
        )}
      </div>
    </div>
  );
}
