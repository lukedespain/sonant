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

  const submission = isFeatured ? await getSubmissionStatus(briefRow.id) : null;
  const alreadySubmitted = submission !== null;

  // Fetch community tracks for all briefs
  type CommunityTrackRaw = { id: string; user_id: string; file_name: string; file_url: string; created_at: string };
  type CommunityTrack = { id: string; file_name: string; file_url: string; created_at: string; canDelete: boolean };
  const { data } = await admin
    .from('community_tracks')
    .select('id, user_id, file_name, file_url, created_at')
    .eq('brief_id', briefRow.id)
    .order('created_at')
    .returns<CommunityTrackRaw[]>();
  const communityTracks: CommunityTrack[] = (data ?? []).map((t) => ({
    id: t.id,
    file_name: t.file_name,
    file_url: t.file_url,
    created_at: t.created_at,
    canDelete: !!user && (t.user_id === user.id || isAdmin),
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
            <SunoPromptModal brief={brief} />
            <ExportPdfButton />
            {isFeatured && user && (
              <SubmitTrackModal
                briefId={briefRow.id}
                projectName={brief.codename}
                alreadySubmitted={alreadySubmitted}
              />
            )}
            {isFeatured && !user && (
              <Link
                href="/login"
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

        {/* Featured track — slim play trigger above the brief document */}
        {featuredTrackUrl && (
          <FeaturedTrackPlayer
            url={featuredTrackUrl}
            fileName={featuredTrack?.file_name}
            briefId={briefRow.id}
            briefName={briefName}
          />
        )}

        <BriefDocument brief={brief} />

        {/* Community tracks — shown on all briefs */}
        <CommunityTracksSection
          briefId={briefRow.id}
          briefName={briefName}
          tracks={communityTracks}
          canUpload={!!user}
          isAdmin={isAdmin}
          featuredTrackId={featuredTrackId}
        />

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
