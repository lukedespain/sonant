import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/auth/actions';
import AccountClient from './AccountClient';
import BusinessDashboard from './BusinessDashboard';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const params = await searchParams;

  const [
    { data: profile },
    { data: rawSubmissions },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('submissions')
      .select('id, brief_id, status, feedback, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  // Fetch brief codenames and types for submissions
  const subBriefIds = [...new Set((rawSubmissions ?? []).map((s) => s.brief_id as string))];
  const { data: subBriefs } = subBriefIds.length
    ? await admin.from('briefs').select('id, generated_content, brief_type').in('id', subBriefIds)
    : { data: [] };
  const subBriefMap = Object.fromEntries(
    (subBriefs ?? []).map((b) => [
      b.id,
      {
        codename: (b.generated_content as { codename?: string })?.codename ?? 'Untitled',
        briefType: (b as any).brief_type ?? 'catalog',
      },
    ])
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const accountType = (profile as any)?.account_type as 'composer' | 'business' ?? 'composer';

  if (accountType === 'business') {
    return (
      <BusinessDashboard
        name={profile?.full_name ?? ''}
        email={user.email ?? ''}
        memberSince={memberSince}
        signOutAction={signOut}
      />
    );
  }

  return (
    <div className="pt-20 pb-16 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <AccountClient
          userId={user.id}
          initialName={profile?.full_name ?? ''}
          initialAvatarUrl={(profile as any)?.avatar_url ?? null}
          email={user.email ?? ''}
          memberSince={memberSince}
          submissionCredits={(profile as any)?.submission_credits ?? 0}
          sessionCredits={(profile as any)?.session_credits ?? 0}
          catalogSubmissions={(rawSubmissions ?? []).map((s) => ({
            id: s.id as string,
            briefId: s.brief_id as string,
            briefCodename: subBriefMap[s.brief_id as string]?.codename ?? 'Untitled',
            briefType: subBriefMap[s.brief_id as string]?.briefType ?? 'catalog',
            status: s.status as string,
            feedback: s.feedback as string | null,
            createdAt: s.created_at as string,
          }))}
          initialTab={params.tab}
          signOutAction={signOut}
        />
      </div>
    </div>
  );
}
