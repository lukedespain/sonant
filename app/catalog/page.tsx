import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import { classifyBrief } from '@/lib/brief-kind';
import type { SubmissionItem } from '@/components/SubmissionHistory';
import CatalogClient from './CatalogClient';

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let submissions: SubmissionItem[] = [];

  if (user) {
    const admin = createAdminClient();
    await ensureMonthlySubmissionCredit(admin, user);
    const full = await admin
      .from('submissions')
      .select('id, brief_id, status, feedback, created_at, delivery, file_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const fallback = full.error
      ? await admin
          .from('submissions')
          .select('id, brief_id, status, feedback, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : null;
    const rawSubmissions = (full.error ? fallback?.data : full.data) ?? [];

    const briefIds = [...new Set(rawSubmissions.map((s) => s.brief_id as string))];
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
  }

  return (
    <div className="pt-16 md:pt-20 pb-12 flex-1 min-w-0 overflow-x-clip">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <Suspense fallback={null}>
          <CatalogClient submissions={submissions} loggedIn={!!user} />
        </Suspense>
      </div>
    </div>
  );
}
