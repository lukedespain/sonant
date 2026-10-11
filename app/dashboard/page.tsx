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
import DashboardView from './DashboardView';

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
      .select('id, brief_id, status, feedback, created_at, delivery, file_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    countAcceptedCatalogSubmissions(admin, user.id),
    readVerifiedOverride(admin, user.id),
  ]);

  const rows = rawSubmissions ?? [];
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
    trackName: (s as { file_name?: string | null }).file_name ?? null,
    briefType: briefMap[s.brief_id as string]?.kind ?? 'catalog',
    delivery: (s as { delivery?: string }).delivery === 'disco' ? 'disco' : 'upload',
    status: s.status as string,
    feedback: s.feedback as string | null,
    createdAt: s.created_at as string,
  }));

  const p = profile as { full_name?: string; email?: string | null; submission_credits?: number } | null;

  return (
    <DashboardView
      initialTab={tab === 'settings' ? 'settings' : 'submissions'}
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
