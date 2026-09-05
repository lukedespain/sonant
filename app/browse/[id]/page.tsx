import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID, isSiteAdmin } from '@/lib/admin';
import { composerHasClientAccess } from '@/lib/verification';
import { resolveDiscoInboxUrl } from '@/lib/disco';
import DiscoInboxInput from '@/components/DiscoInboxInput';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
import ShareBriefButton from '@/components/ShareBriefButton';
import SunoPromptModal from '@/components/SunoPromptModal';
import DeleteBriefButton from '@/components/DeleteBriefButton';
import CommunityTracksSection from '@/components/CommunityTracksSection';
import BriefNextSteps from '@/components/BriefNextSteps';
import BriefImageUpload from '@/components/BriefImageUpload';
import RegenerateImageButton from '@/components/RegenerateImageButton';
import AnnounceBriefButton from '@/components/AnnounceBriefButton';
import { getSubmissionStatus } from '@/app/briefs/actions';
import { getTrackPrivacyMap, isTrackPublic } from '@/lib/track-privacy';

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
  const isClientBrief = (briefRow as { brief_type?: string }).brief_type === 'client' || brief.kind === 'client';
  const isFeatured = briefRow.user_id === ADMIN_USER_ID && !isClientBrief;
  const isAdmin = isSiteAdmin(user);

  let canViewClient = isAdmin;
  if (user && isClientBrief && !canViewClient) {
    canViewClient = await composerHasClientAccess(admin, user.id, false);
  }

  const discoUrl = isClientBrief
    ? resolveDiscoInboxUrl((briefRow as { disco_inbox_url?: string | null }).disco_inbox_url)
    : null;

  if (isClientBrief && !canViewClient) {
    return (
      <div className="pt-20 pb-12 flex-1">
        <div className="max-w-xl mx-auto px-6 md:px-10 text-center">
          <div
            className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Verified composers only
          </div>
          <h1
            className="text-4xl tracking-tight mb-4"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            Paid client briefs.
          </h1>
          <p
            className="text-sm text-[var(--text-muted)] leading-relaxed mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Place three tracks in the catalog to earn the badge and unlock access to paying clients.
          </p>
          <Link
            href="/browse?tab=catalog"
            className="text-xs tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ← Back to the Library
          </Link>
        </div>
      </div>
    );
  }

  const submission = await getSubmissionStatus(briefRow.id);
  const alreadySubmitted = submission !== null;

  type CommunityTrackRaw = { id: string; user_id: string; file_name: string; file_url: string; created_at: string };
  const [{ data }, privacyMap, { data: currentProfile }] = await Promise.all([
    isClientBrief
      ? Promise.resolve({ data: [] as CommunityTrackRaw[] })
      : admin
          .from('community_tracks')
          .select('id, user_id, file_name, file_url, created_at')
          .eq('brief_id', briefRow.id)
          .order('created_at')
          .returns<CommunityTrackRaw[]>(),
    getTrackPrivacyMap(admin),
    user
      ? admin.from('profiles').select('full_name, tier, submission_credits').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const visibleRaw = (data ?? []).filter(
    (t) => isTrackPublic(privacyMap, t.id) || t.user_id === user?.id
  );

  const uploaderIds = [...new Set(visibleRaw.map((t) => t.user_id))];
  const { data: profiles } = uploaderIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', uploaderIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));

  const currentUserName = (currentProfile as { full_name?: string } | null)?.full_name ?? '';
  const submissionCredits = (currentProfile as { submission_credits?: number } | null)?.submission_credits ?? 0;
  const isPro = isAdmin || user?.email?.endsWith('@sonant.ac') ||
    (currentProfile as { tier?: string } | null)?.tier === 'pro';

  const communityTracks = visibleRaw.map((t) => ({
    id: t.id,
    file_name: t.file_name,
    file_url: t.file_url,
    created_at: t.created_at,
    canDelete: !!user && (t.user_id === user.id || isAdmin),
    uploader_name: profileMap[t.user_id] ?? 'Anonymous',
    uploader_id: t.user_id,
    is_public: isTrackPublic(privacyMap, t.id),
    isOwner: !!user && t.user_id === user.id,
  }));

  const featuredTrackId = (briefRow.featured_track_id as string | null) ?? null;

  return (
    <div className="pt-20 pb-12 flex-1 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="no-print mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/browse"
              className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ← Back to the Library
            </Link>
            {!isFeatured && !isClientBrief && (
              <Link
                href={`/profile/${briefRow.user_id}`}
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Composer profile →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (isClientBrief || isFeatured) && (
              <AnnounceBriefButton
                briefId={briefRow.id}
                kind={isClientBrief ? 'client' : 'featured'}
              />
            )}
            {isAdmin && <RegenerateImageButton briefId={briefRow.id} />}
            {isAdmin && <BriefImageUpload briefId={briefRow.id} hasImage={!!brief.imageUrl} />}
            {isPro && <SunoPromptModal brief={brief} />}
            {!isClientBrief && (
              <ShareBriefButton
                briefId={briefRow.id}
                briefName={brief.projectTitle || brief.codename}
                loggedIn={!!user}
              />
            )}
            <ExportPdfButton />
            {!!user && (isAdmin || user.id === briefRow.user_id) && (
              <DeleteBriefButton briefId={briefRow.id} redirectPath="/browse" />
            )}
          </div>
        </div>

        {isClientBrief && (
          <div
            className="no-print mb-6 border border-[#E85D2F]/40 bg-[#E85D2F]/5 px-5 py-4"
            style={{ borderRadius: '2px' }}
          >
            <div
              className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ◆ Do not share this brief
            </div>
            <p
              className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Paid client work stays inside Sonant. Do not forward this page, the PDF, or the references. If this reached the wrong person, tell the Sonant team.
            </p>
            {isAdmin && (
              <DiscoInboxInput
                briefId={briefRow.id}
                currentUrl={(briefRow as { disco_inbox_url?: string | null }).disco_inbox_url ?? null}
              />
            )}
          </div>
        )}

        <BriefDocument brief={brief} isFeatured={isFeatured} />

        <BriefNextSteps
          briefId={briefRow.id}
          briefName={brief.projectTitle || brief.codename}
          variant={isClientBrief ? 'client' : 'catalog'}
          loggedIn={!!user}
          alreadySubmitted={alreadySubmitted}
          submissionCredits={submissionCredits}
          isAdmin={isAdmin}
          currentUserName={currentUserName}
          discoUrl={discoUrl}
        />

        {!isClientBrief && (
          <CommunityTracksSection
            briefId={briefRow.id}
            briefName={briefName}
            tracks={communityTracks}
            isAdmin={isAdmin}
            featuredTrackId={featuredTrackId}
          />
        )}
      </div>
    </div>
  );
}
