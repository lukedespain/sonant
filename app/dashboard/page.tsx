import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import { listNotifications } from '@/lib/notifications';
import { classifyBrief } from '@/lib/brief-kind';
import {
  VERIFICATION_THRESHOLD,
  countAcceptedCatalogSubmissions,
  isVerifiedComposer,
  readVerifiedOverride,
} from '@/lib/verification';
import type { SubmissionItem } from '@/components/SubmissionHistory';
import { readHandoffs, readRights } from '@/lib/handoff';
import { catalogPartnerById } from '@/lib/partners';
import { submissionFileName } from '@/lib/submission-files';
import DashboardView from './DashboardView';
import type { Offer } from './OfferCard';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard');

  const { tab } = await searchParams;
  const admin = createAdminClient();
  const isAdmin = isSiteAdmin(user);
  const monthly = await ensureMonthlySubmissionCredit(admin, user);

  const [{ data: profile }, notifications, { data: rawSubmissions }, acceptedCount, override] = await Promise.all([
    admin.from('profiles').select('full_name, email, submission_credits').eq('id', user.id).single(),
    listNotifications(admin, user.id),
    admin
      .from('submissions')
      .select('id, brief_id, status, feedback, created_at, delivery')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    countAcceptedCatalogSubmissions(admin, user.id),
    readVerifiedOverride(admin, user.id),
  ]);

  const rows = rawSubmissions ?? [];
  const fileNames = Object.fromEntries(
    await Promise.all(
      rows
        .filter((s) => (s as { delivery?: string }).delivery !== 'disco')
        .map(async (s) => [s.id as string, await submissionFileName(admin, s.id as string)] as const)
    )
  );
  const briefIds = [...new Set(rows.map((s) => s.brief_id as string))];
  const { data: briefs } = briefIds.length
    ? await admin.from('briefs').select('id, user_id, generated_content, brief_type').in('id', briefIds)
    : { data: [] };
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b) => {
      const content = b.generated_content as { codename?: string; projectTitle?: string } | null;
      return [b.id, { name: content?.projectTitle || content?.codename || 'Untitled', kind: classifyBrief(b) }];
    })
  );

  const submissions: SubmissionItem[] = rows.map((s) => ({
    id: s.id as string,
    briefId: s.brief_id as string,
    briefCodename: briefMap[s.brief_id as string]?.name ?? 'Untitled',
    trackName: fileNames[s.id as string] ?? null,
    briefType: briefMap[s.brief_id as string]?.kind ?? 'catalog',
    delivery: (s as { delivery?: string }).delivery === 'disco' ? 'disco' : 'upload',
    status: s.status as string,
    feedback: s.feedback as string | null,
    createdAt: s.created_at as string,
  }));

  const handoffs = readHandoffs(user.app_metadata);
  const offers: Offer[] = submissions
    .filter((s) => s.status === 'accepted' && handoffs[s.id] && !handoffs[s.id].agreedAt)
    .map((s) => {
      const partner = catalogPartnerById(handoffs[s.id].catalogId) ?? catalogPartnerById('sonant')!;
      return {
        submissionId: s.id,
        briefName: s.briefCodename,
        trackName: s.trackName ?? null,
        catalogName: partner.name,
        catalogDeal: `${partner.exclusive ? 'Exclusive' : 'Non-exclusive'} · ${partner.split}`,
        terms: partner.terms,
        humanMadeOnly: partner.humanMadeOnly,
      };
    });

  const p = profile as { full_name?: string; email?: string | null; submission_credits?: number } | null;

  return (
    <DashboardView
      initialTab={tab === 'settings' || tab === 'info' ? tab : 'submissions'}
      rights={readRights(user.user_metadata)}
      offers={offers}
      name={p?.full_name ?? ''}
      email={p?.email ?? user.email ?? ''}
      isAdmin={isAdmin}
      submissionCredits={monthly?.credits ?? p?.submission_credits ?? 0}
      daysUntilNextCredit={monthly?.daysUntilNext ?? null}
      notifications={notifications}
      submissions={submissions}
      inReview={submissions.filter((s) => s.status === 'received' || s.status === 'pending' || s.status === 'sent_to_catalog').length}
      acceptedCount={acceptedCount}
      verified={isAdmin || isVerifiedComposer(acceptedCount, override)}
      verificationThreshold={VERIFICATION_THRESHOLD}
    />
  );
}
