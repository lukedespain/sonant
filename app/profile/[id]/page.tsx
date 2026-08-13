import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ProfileView from './ProfileView';

interface BriefCard {
  id: string;
  mode: string;
  target: string;
  codename: string;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  const [{ count: briefsCount }, { count: submissionsCount }, { count: acceptedCount }, { data: briefs }] =
    await Promise.all([
      admin.from('briefs').select('id', { count: 'exact', head: true }).eq('user_id', id),
      admin.from('submissions').select('id', { count: 'exact', head: true }).eq('user_id', id),
      admin.from('submissions').select('id', { count: 'exact', head: true }).eq('user_id', id).eq('status', 'accepted'),
      admin
        .from('briefs')
        .select('id, mode, target, generated_content')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

  const briefCards: BriefCard[] = (briefs ?? []).map((b) => ({
    id: b.id as string,
    mode: b.mode as string,
    target: (b.target as string) ?? '',
    codename: ((b.generated_content as { codename?: string } | null)?.codename) ?? 'Untitled',
  }));

  return (
    <ProfileView
      profileId={id}
      isOwner={user?.id === id}
      name={(profile as { full_name?: string }).full_name ?? ''}
      avatarUrl={(profile as { avatar_url?: string | null }).avatar_url ?? null}
      bio={(profile as { bio?: string | null }).bio ?? ''}
      website={(profile as { website?: string | null }).website ?? ''}
      briefsGenerated={briefsCount ?? 0}
      tracksSubmitted={submissionsCount ?? 0}
      accepted={acceptedCount ?? 0}
      briefs={briefCards}
    />
  );
}
