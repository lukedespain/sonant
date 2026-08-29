import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrackPrivacyMap, isTrackPublic } from '@/lib/track-privacy';
import { countAcceptedCatalogSubmissions, readVerifiedOverride } from '@/lib/verification';
import { isSiteAdmin } from '@/lib/admin';
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
  const isOwner = user?.id === id;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  const [acceptedCount, verifiedOverride, { data: authUser }, { data: tracks }, privacyMap] = await Promise.all([
    countAcceptedCatalogSubmissions(admin, id),
    readVerifiedOverride(admin, id),
    admin.auth.admin.getUserById(id),
    admin
      .from('community_tracks')
      .select('id, brief_id, file_name, file_url, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    getTrackPrivacyMap(admin),
  ]);

  const meta = authUser?.user?.user_metadata as { bio?: string; website?: string } | undefined;
  const allTracks = tracks ?? [];
  const visibleTracks = allTracks.filter((t) => isOwner || isTrackPublic(privacyMap, t.id as string));
  const briefIds = [...new Set(visibleTracks.map((t) => t.brief_id as string))];
  const { data: briefs } = briefIds.length
    ? await admin.from('briefs').select('id, generated_content').in('id', briefIds)
    : { data: [] };
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b: { id: string; generated_content: { codename?: string } | null }) => [
      b.id,
      (b.generated_content as { codename?: string } | null)?.codename ?? 'Untitled',
    ])
  );

  return (
    <ProfileView
      profileId={id}
      isOwner={isOwner}
      isAdmin={isSiteAdmin(user)}
      name={(profile as { full_name?: string }).full_name ?? ''}
      avatarUrl={(profile as { avatar_url?: string | null }).avatar_url ?? null}
      accepted={acceptedCount}
      verifiedOverride={verifiedOverride}
      bio={typeof meta?.bio === 'string' ? meta.bio : ''}
      website={typeof meta?.website === 'string' ? meta.website : ''}
      tracks={visibleTracks.map((t) => ({
        id: t.id as string,
        fileName: (t.file_name as string) ?? 'Untitled',
        fileUrl: t.file_url as string,
        briefId: t.brief_id as string,
        briefName: briefMap[t.brief_id as string] ?? 'Untitled',
        isPublic: isTrackPublic(privacyMap, t.id as string),
      }))}
    />
  );
}
