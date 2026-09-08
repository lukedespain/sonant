import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import { classifyBrief } from '@/lib/brief-kind';
import type { SubmissionItem } from '@/components/SubmissionHistory';
import CatalogClient, { type CatalogUpload } from './CatalogClient';

function namesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const strip = (value: string) => value.replace(/\.[^/.]+$/, '').trim().toLowerCase();
  return strip(a) === strip(b);
}

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let uploads: CatalogUpload[] = [];
  let submissions: SubmissionItem[] = [];
  let submissionCredits = 0;
  const isAdmin = isSiteAdmin(user);

  if (user) {
    const admin = createAdminClient();
    const monthly = await ensureMonthlySubmissionCredit(admin, user);
    const { data: profile } = await admin
      .from('profiles')
      .select('submission_credits')
      .eq('id', user.id)
      .single();
    submissionCredits = monthly?.credits ?? (profile as { submission_credits?: number } | null)?.submission_credits ?? 0;

    const [{ data: tracks }, full] = await Promise.all([
      admin
        .from('community_tracks')
        .select('id, brief_id, file_name, file_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      admin
        .from('submissions')
        .select('id, brief_id, status, feedback, created_at, delivery, file_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const fallback = full.error
      ? await admin
          .from('submissions')
          .select('id, brief_id, status, feedback, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : null;
    const rawSubmissions = (full.error ? fallback?.data : full.data) ?? [];

    const briefIds = [...new Set([
      ...(tracks ?? []).map((t) => t.brief_id as string),
      ...rawSubmissions.map((s) => s.brief_id as string),
    ])];
    const { data: briefs } = briefIds.length
      ? await admin.from('briefs').select('id, user_id, generated_content, brief_type').in('id', briefIds)
      : { data: [] };

    const briefMap = Object.fromEntries(
      (briefs ?? []).map((b) => {
        const content = b.generated_content as { codename?: string; projectTitle?: string } | null;
        return [
          b.id,
          {
            name: content?.projectTitle || content?.codename || 'Untitled',
            kind: classifyBrief(b),
          },
        ];
      })
    );

    submissions = rawSubmissions.map((s) => ({
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

    uploads = (tracks ?? []).map((t) => {
      const briefId = t.brief_id as string;
      const kind = briefMap[briefId]?.kind ?? 'community';
      const fileName = (t.file_name as string) ?? 'Untitled';
      const namedMatch = submissions.find((s) => s.briefId === briefId && namesMatch(s.trackName, fileName));
      return {
        id: t.id as string,
        fileName,
        fileUrl: t.file_url as string,
        briefId,
        briefName: briefMap[briefId]?.name ?? 'Untitled',
        kind,
        createdAt: t.created_at as string,
        submitted: !!namedMatch,
        submissionStatus: namedMatch?.status ?? null,
      };
    });
  }

  return (
    <div className="pt-16 md:pt-20 pb-12 flex-1 min-w-0 overflow-x-clip">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Suspense fallback={null}>
          <CatalogClient
            uploads={uploads}
            submissions={submissions}
            loggedIn={!!user}
            submissionCredits={submissionCredits}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </div>
  );
}
