import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_USER_ID, isSiteAdmin } from '@/lib/admin';
import {
  VERIFICATION_THRESHOLD,
  countAcceptedCatalogSubmissions,
  isVerifiedComposer,
  readVerifiedOverride,
} from '@/lib/verification';
import { isBriefClosed } from '@/lib/brief-status';
import { Page, PageHeader } from '@/components/ui';
import BriefImporter from '@/components/BriefImporter';
import BrowseClient, { type BriefRow } from './BrowseClient';

const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function newCutoff() {
  return Date.now() - NEW_FOR_MS;
}

const FIELDS = 'id, user_id, mode, target, genres, moods, generated_content, created_at, featured_track_url';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  const isBriefAdmin = isSiteAdmin(user);

  let acceptedCount = 0;
  let isVerified = isBriefAdmin;
  let hasSubmitted = true;
  if (user && !isBriefAdmin) {
    const [count, override, { count: submissionCount }] = await Promise.all([
      countAcceptedCatalogSubmissions(admin, user.id),
      readVerifiedOverride(admin, user.id),
      admin.from('submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    acceptedCount = count;
    isVerified = isVerifiedComposer(count, override);
    hasSubmitted = (submissionCount ?? 0) > 0;
  }

  const [{ data: featuredBriefs }, { data: clientRows }, { data: communityBriefs }] = await Promise.all([
    admin
      .from('briefs')
      .select(FIELDS)
      .eq('user_id', ADMIN_USER_ID)
      .eq('brief_type', 'catalog')
      .order('created_at', { ascending: false })
      .returns<BriefRow[]>(),
    // Rows sent to the browser are visible to anyone who opens dev tools, so
    // unverified viewers never receive client briefs at all.
    isVerified
      ? admin
          .from('briefs')
          .select(FIELDS)
          .eq('brief_type', 'client')
          .order('created_at', { ascending: false })
          .returns<BriefRow[]>()
      : Promise.resolve({ data: [] as BriefRow[] }),
    admin
      .from('briefs')
      .select(FIELDS)
      .or(`user_id.neq.${ADMIN_USER_ID},brief_type.eq.community`)
      .neq('brief_type', 'client')
      .order('created_at', { ascending: false })
      .limit(80)
      .returns<BriefRow[]>(),
  ]);

  const clientBriefs = (clientRows ?? []).filter((b) => !isBriefClosed(b.generated_content));

  return (
    <Page>
      <PageHeader
        title="The Briefs."
        description="Practice briefs for reps, catalog briefs the houses are looking for, and paid client work for verified composers."
      />
      {user && <BriefImporter />}
      <BrowseClient
        featuredBriefs={featuredBriefs ?? []}
        clientBriefs={clientBriefs}
        communityBriefs={communityBriefs ?? []}
        currentUserId={user?.id ?? null}
        mineOnlyDefault={params.mine === '1'}
        isVerified={isVerified}
        isBriefAdmin={isBriefAdmin}
        signedIn={!!user}
        acceptedCount={acceptedCount}
        verificationThreshold={VERIFICATION_THRESHOLD}
        showStartHere={!!user && !isBriefAdmin && !hasSubmitted}
        newSince={newCutoff()}
      />
    </Page>
  );
}
