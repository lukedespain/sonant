import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ProfileView from './ProfileView';

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
    .select('full_name, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  const { count: acceptedCount } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('status', 'accepted');

  return (
    <ProfileView
      profileId={id}
      isOwner={user?.id === id}
      name={(profile as { full_name?: string }).full_name ?? ''}
      avatarUrl={(profile as { avatar_url?: string | null }).avatar_url ?? null}
      accepted={acceptedCount ?? 0}
    />
  );
}
