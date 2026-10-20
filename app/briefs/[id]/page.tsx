import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { classifyBrief } from '@/lib/brief-kind';
import { composerHasClientAccess } from '@/lib/verification';
import { resolveDiscoInboxUrl } from '@/lib/disco';
import DiscoInboxInput from '@/components/DiscoInboxInput';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ShareBriefButton from '@/components/ShareBriefButton';
import SunoPromptModal from '@/components/SunoPromptModal';
import DeleteBriefButton from '@/components/DeleteBriefButton';
import MoveToPracticeButton from '@/components/MoveToPracticeButton';
import CommunityTracksSection from '@/components/CommunityTracksSection';
import BriefNextSteps from '@/components/BriefNextSteps';
import BriefImageUpload from '@/components/BriefImageUpload';
import RegenerateImageButton from '@/components/RegenerateImageButton';
import AnnounceBriefButton from '@/components/AnnounceBriefButton';
import CloseBriefButton from '@/components/CloseBriefButton';
import HomeStarButton from '@/components/HomeStarButton';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import ClientBriefSubmitModal from '@/components/ClientBriefSubmitModal';
import { AdminMenu, DownloadBriefButton } from '@/components/BriefActions';
import { btn } from '@/components/ui';
import { isBriefClosed } from '@/lib/brief-status';
import { getSubmissionStatus } from '@/app/briefs/actions';
import { getTrackPrivacyMap, isTrackPublic } from '@/lib/track-privacy';
import { CATALOG_PARTNERS, catalogPartnerFromBrief } from '@/lib/partners';

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
  const kind = classifyBrief(briefRow);
  const isClientBrief = kind === 'client';
  const isFeatured = kind === 'catalog';
  const isAdmin = isSiteAdmin(user);
  const catalogPartner = isFeatured ? catalogPartnerFromBrief(brief) ?? CATALOG_PARTNERS.sonant : null;

  let canViewClient = isAdmin;
  if (user && isClientBrief && !canViewClient) {
    canViewClient = await composerHasClientAccess(admin, user.id, false);
  }

  const discoUrl = isClientBrief
    ? resolveDiscoInboxUrl((briefRow as { disco_inbox_url?: string | null }).disco_inbox_url)
    : null;

  if (isClientBrief && !canViewClient) {
    return (
      <div className="flex-1 pt-24 pb-24">
        <div className="max-w-xl mx-auto px-5 text-center">
          <p className="label text-[var(--accent)]">Verified composers only</p>
          <h1 className="mt-4 font-serif font-light text-4xl md:text-5xl tracking-tight">Paid client briefs.</h1>
          <p className="mt-4 text-[15px] text-[var(--text-muted)] leading-relaxed">
            Get three tracks accepted into a catalog to unlock paid client work.
          </p>
          <Link href="/briefs#catalog" className={btn('secondary', 'md', 'mt-8')}>
            See catalog briefs
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

  const closed = isClientBrief && isBriefClosed(brief);
  const title = brief.projectTitle || brief.codename;
  const kindLabel = isClientBrief
    ? 'Paid client brief'
    : isFeatured
      ? `${catalogPartner?.name} catalog brief`
      : 'Practice brief';

  return (
    <div className="flex-1 min-w-0 pt-8 md:pt-10 pb-24 overflow-x-clip">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        <div className="no-print flex items-center justify-between gap-3 mb-6">
          <Link href="/briefs" className={btn('ghost', 'sm')}>
            ← Briefs
          </Link>
          <div className="flex items-center gap-2">
            {!isClientBrief && (
              <ShareBriefButton briefId={briefRow.id} briefName={title} loggedIn={!!user} />
            )}
            {isPro && !isAdmin && <SunoPromptModal brief={brief} />}
            {isAdmin && (
              <AdminMenu>
                {(isClientBrief || isFeatured) && (
                  <AnnounceBriefButton briefId={briefRow.id} kind={isClientBrief ? 'client' : 'featured'} />
                )}
                {isClientBrief && <CloseBriefButton briefId={briefRow.id} closed={!!brief.closedAt} />}
                {isFeatured && <HomeStarButton briefId={briefRow.id} featured={!!brief.homeFeatured} variant="menu" />}
                <SunoPromptModal brief={brief} />
                <RegenerateImageButton briefId={briefRow.id} />
                <BriefImageUpload briefId={briefRow.id} hasImage={!!brief.imageUrl} />
                {isFeatured && <MoveToPracticeButton briefId={briefRow.id} />}
                <DeleteBriefButton briefId={briefRow.id} redirectPath="/briefs" canMoveToPractice={isFeatured} />
              </AdminMenu>
            )}
            {!isAdmin && !!user && user.id === briefRow.user_id && (
              <DeleteBriefButton briefId={briefRow.id} redirectPath="/briefs" />
            )}
          </div>
        </div>

        <div className="no-print sticky top-16 z-20 -mx-5 md:mx-0 px-5 md:px-0 py-3 mb-6 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-base)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={`label ${closed ? 'text-[var(--text-dimmer)]' : 'text-[var(--accent)]'}`}>
              {closed ? 'Closed · ' : '◆ '}
              {kindLabel}
            </p>
            <p className="font-serif italic text-lg tracking-tight truncate">{title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DownloadBriefButton briefId={briefRow.id} className="hidden sm:inline-flex" />
            {isFeatured &&
              (user ? (
                <SubmitTrackModal
                  briefId={briefRow.id}
                  projectName={title}
                  alreadySubmitted={alreadySubmitted}
                  submissionCredits={submissionCredits}
                  isAdmin={isAdmin}
                  triggerLabel="↗ Submit"
                  triggerClassName={btn('primary', 'sm')}
                />
              ) : (
                <Link href={`/signup?redirect=/briefs/${briefRow.id}`} className={btn('primary', 'sm')}>
                  Submit
                </Link>
              ))}
            {isClientBrief && !closed && user && (
              <ClientBriefSubmitModal
                briefId={briefRow.id}
                briefName={title}
                composerName={currentUserName}
                discoUrl={discoUrl}
                triggerLabel="↗ Deliver"
                triggerClassName={btn('primary', 'sm')}
              />
            )}
            {!isFeatured && !isClientBrief && <DownloadBriefButton briefId={briefRow.id} className="sm:hidden" />}
          </div>
        </div>

        {isClientBrief && (
          <div className="no-print mb-6 text-sm text-[var(--text-muted)] leading-relaxed">
            <span className="text-[var(--accent)]">◆ Private.</span> Paid client work stays inside Sonant. Please do not forward this page, the PDF, or the references.
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
          briefName={title}
          variant={isClientBrief ? 'client' : isFeatured ? 'catalog' : 'practice'}
          catalogExclusive={catalogPartner?.exclusive}
          catalogName={catalogPartner?.name}
          catalogSplit={catalogPartner?.split}
          humanMadeOnly={catalogPartner?.humanMadeOnly}
          loggedIn={!!user}
          alreadySubmitted={alreadySubmitted}
          submissionCredits={submissionCredits}
          isAdmin={isAdmin}
          currentUserName={currentUserName}
          discoUrl={discoUrl}
          closed={closed}
        />

        {isAdmin && !isClientBrief && communityTracks.length > 0 && (
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
