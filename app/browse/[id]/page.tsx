import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import SunoPromptModal from '@/components/SunoPromptModal';
import DeleteBriefButton from '@/components/DeleteBriefButton';
import CommunityTracksSection from '@/components/CommunityTracksSection';
import FeaturedTrackPlayer from '@/components/FeaturedTrackPlayer';
import BriefImageUpload from '@/components/BriefImageUpload';
import RegenerateImageButton from '@/components/RegenerateImageButton';
import { getSubmissionStatus } from '@/app/briefs/actions';

// DiscoAdminInput is imported but hidden until we decide to re-enable it
// import DiscoAdminInput from '@/components/DiscoAdminInput';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BrowseBriefPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: briefRow, error } = await admin
    .from('briefs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !briefRow) notFound();

  const brief = briefRow.generated_content as Brief;
  const briefName = brief.codename ?? 'Untitled';
  const isFeatured = briefRow.user_id === ADMIN_USER_ID;
  const isAdmin = !!user && user.id === ADMIN_USER_ID;

  const submission = await getSubmissionStatus(briefRow.id);
  const alreadySubmitted = submission !== null;

  // Fetch community tracks for all briefs
  type CommunityTrackRaw = { id: string; user_id: string; file_name: string; file_url: string; created_at: string };
  type CommunityTrack = { id: string; file_name: string; file_url: string; created_at: string; canDelete: boolean; uploader_name: string };
  const { data } = await admin
    .from('community_tracks')
    .select('id, user_id, file_name, file_url, created_at')
    .eq('brief_id', briefRow.id)
    .order('created_at')
    .returns<CommunityTrackRaw[]>();

  // Fetch uploader names from profiles
  const uploaderIds = [...new Set((data ?? []).map((t) => t.user_id))];
  const { data: profiles } = uploaderIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', uploaderIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));

  // Fetch current user's display name and tier for the upload modal and feature gating
  const { data: currentProfile } = user
    ? await admin.from('profiles').select('full_name, tier').eq('id', user.id).single()
    : { data: null };
  const currentUserName = (currentProfile as { full_name?: string; tier?: string } | null)?.full_name ?? '';
  const isPro = isAdmin || user?.email?.endsWith('@sonant.ac') ||
    (currentProfile as { tier?: string } | null)?.tier === 'pro';

  const communityTracks: CommunityTrack[] = (data ?? []).map((t) => ({
    id: t.id,
    file_name: t.file_name,
    file_url: t.file_url,
    created_at: t.created_at,
    canDelete: !!user && (t.user_id === user.id || isAdmin),
    uploader_name: profileMap[t.user_id] ?? 'Anonymous',
  }));

  // Resolve featured track details from the community tracks list
  const featuredTrackId = (briefRow.featured_track_id as string | null) ?? null;
  const featuredTrackUrl = (briefRow.featured_track_url as string | null) ?? null;
  const featuredTrack = featuredTrackId
    ? communityTracks.find((t) => t.id === featuredTrackId) ?? null
    : null;

  // Disco embed vars kept for future use — rendering is hidden
  // const discoPlaylistId = (briefRow.disco_playlist_id as string | null) ?? null;
  // const discoToken = process.env.DISCO_EMBED_TOKEN;
  // const discoEmbedSrc = discoPlaylistId && discoToken
  //   ? `https://sonant.disco.ac/e/p/${discoPlaylistId}?download=true&s=${encodeURIComponent(discoToken)}&artwork=true&color=%23E85D2F&theme=dark`
  //   : null;

  return (
    <div className="pt-20 pb-12 flex-1 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="no-print mb-6 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/browse"
            className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ← Browse Briefs
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && <RegenerateImageButton briefId={briefRow.id} />}
            {isAdmin && <BriefImageUpload briefId={briefRow.id} hasImage={!!brief.imageUrl} />}
            {isPro && <SunoPromptModal brief={brief} />}
            <ExportPdfButton />
            {user && (
              <SubmitTrackModal
                briefId={briefRow.id}
                projectName={brief.codename}
                alreadySubmitted={alreadySubmitted}
              />
            )}
            {!user && (
              <Link
                href={`/login?redirect=/browse/${briefRow.id}`}
                className="px-5 py-2 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                ↗ Sign In to Submit
              </Link>
            )}
            {!!user && (isAdmin || user.id === briefRow.user_id) && (
              <DeleteBriefButton briefId={briefRow.id} redirectPath="/browse" />
            )}
          </div>
        </div>

        {/* Featured track player hidden. Keep FeaturedTrackPlayer.tsx to restore later. */}
        {false && featuredTrackUrl && (
          <FeaturedTrackPlayer
            url={featuredTrackUrl}
            fileName={featuredTrack?.file_name}
            briefId={briefRow.id}
            briefName={briefName}
          />
        )}

        <BriefDocument brief={brief} isFeatured={isFeatured} />

        <div className="mt-10 no-print border border-[var(--border-card)] bg-[var(--bg-card)] p-8" style={{ borderRadius: '2px' }}>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Submissions
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {isFeatured
              ? 'This is a featured Sonant brief. Submissions go privately to the Sonant team. Every submission gets written feedback. Accepted tracks are added to the catalog and pitched to buyers.'
              : 'This is a community brief. You can still submit a track for written feedback and catalog consideration. One submission credit. Featured Sonant briefs are more likely to be placed in the catalog.'}
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Use the Submit Track button above to send your entry.
          </p>
        </div>

        {/* Public community uploads hidden. Keep CommunityTracksSection.tsx to restore later. */}
        {false && (
          <CommunityTracksSection
            briefId={briefRow.id}
            briefName={briefName}
            tracks={communityTracks}
            canUpload={!!user}
            isAdmin={isAdmin}
            featuredTrackId={featuredTrackId}
            currentUserName={currentUserName}
          />
        )}

        {/* Disco admin input — hidden for now, keeping code for future use */}
        {/* isAdmin && (
          <div className="mt-8 max-w-xl no-print">
            <DiscoAdminInput briefId={briefRow.id} currentId={discoPlaylistId} />
          </div>
        ) */}
      </div>
    </div>
  );
}
