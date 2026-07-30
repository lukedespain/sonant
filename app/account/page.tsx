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

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Activity stats
  const [
    { count: submissionsCount },
    { count: uploadsCount },
    { data: generatedBriefs },
    { data: featuredBriefs },
    { data: userTracks },
  ] = await Promise.all([
    admin.from('submissions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('community_tracks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('briefs').select('id').eq('user_id', user.id).neq('user_id', ADMIN_USER_ID),
    admin.from('briefs').select('featured_track_id').not('featured_track_id', 'is', null),
    admin.from('community_tracks').select('id').eq('user_id', user.id),
  ]);

  const featuredTrackIds = new Set((featuredBriefs ?? []).map((b) => b.featured_track_id as string));
  const userTrackIds = new Set((userTracks ?? []).map((t) => t.id));
  const featuredCount = [...featuredTrackIds].filter((id) => userTrackIds.has(id)).length;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const isPro = profile?.tier === 'pro' || (user.email?.endsWith('@sonant.ac') ?? false);

  return (
    <div className="pt-20 pb-16 flex-1">
      <div className="max-w-3xl mx-auto px-6 md:px-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Account
        </div>
        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-12" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Your <span className="italic">dashboard.</span>
        </h1>

        <AccountClient
          userId={user.id}
          initialName={profile?.full_name ?? ''}
          initialAvatarUrl={(profile as any)?.avatar_url ?? null}
          email={user.email ?? ''}
          isPro={isPro}
          memberSince={memberSince}
          submissionCredits={(profile as any)?.submission_credits ?? 0}
          sessionCredits={(profile as any)?.session_credits ?? 0}
          stats={{
            submissions: submissionsCount ?? 0,
            featured: featuredCount,
            uploads: uploadsCount ?? 0,
            generations: generatedBriefs?.length ?? 0,
          }}
          signOutAction={signOut}
        />
      </div>
    </div>
  );
}
