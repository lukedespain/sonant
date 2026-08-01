import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/auth/actions';
import AccountClient from './AccountClient';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [
    { data: profile },
    { data: rawBriefs },
    { data: rawTracks },
    { data: rawSubmissions },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('briefs')
      .select('id, mode, target, genres, moods, generated_content, created_at')
      .eq('user_id', user.id)
      .neq('user_id', ADMIN_USER_ID)
      .order('created_at', { ascending: false }),
    admin
      .from('community_tracks')
      .select('id, brief_id, file_name, file_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('submissions')
      .select('id, brief_id, status, feedback, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  // Brief codenames for tracks
  const trackBriefIds = [...new Set((rawTracks ?? []).map((t) => t.brief_id as string))];
  const { data: trackBriefs } = trackBriefIds.length
    ? await admin.from('briefs').select('id, generated_content').in('id', trackBriefIds)
    : { data: [] };
  const trackBriefMap = Object.fromEntries(
    (trackBriefs ?? []).map((b) => [
      b.id,
      (b.generated_content as { codename?: string })?.codename ?? 'Untitled',
    ])
  );

  // Brief codenames for submissions
  const subBriefIds = [...new Set((rawSubmissions ?? []).map((s) => s.brief_id as string))];
  const { data: subBriefs } = subBriefIds.length
    ? await admin.from('briefs').select('id, generated_content').in('id', subBriefIds)
    : { data: [] };
  const subBriefMap = Object.fromEntries(
    (subBriefs ?? []).map((b) => [
      b.id,
      (b.generated_content as { codename?: string })?.codename ?? 'Untitled',
    ])
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

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
          generatedBriefs={(rawBriefs ?? []) as any[]}
          uploadedTracks={(rawTracks ?? []).map((t) => ({
            id: t.id as string,
            briefId: t.brief_id as string,
            briefCodename: trackBriefMap[t.brief_id as string] ?? 'Untitled',
            fileName: t.file_name as string,
            fileUrl: t.file_url as string,
            createdAt: t.created_at as string,
          }))}
          catalogSubmissions={(rawSubmissions ?? []).map((s) => ({
            id: s.id as string,
            briefId: s.brief_id as string,
            briefCodename: subBriefMap[s.brief_id as string] ?? 'Untitled',
            status: s.status as string,
            feedback: s.feedback as string | null,
            createdAt: s.created_at as string,
          }))}
          signOutAction={signOut}
        />
      </div>
    </div>
  );
}
