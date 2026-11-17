import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminView } from '@/lib/admin-view';
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
import BriefPanel, { BriefPrimaryAction, type BriefPanelProps } from '@/components/BriefPanel';
import { composerStatus } from '@/components/SubmissionHistory';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import { readHandoffs } from '@/lib/handoff';
import BriefImageUpload from '@/components/BriefImageUpload';
import RegenerateImageButton from '@/components/RegenerateImageButton';
import AnnounceBriefButton from '@/components/AnnounceBriefButton';
import CloseBriefButton from '@/components/CloseBriefButton';
import HomeStarButton from '@/components/HomeStarButton';
import { AdminMenu } from '@/components/BriefActions';
import { AppPage, btn } from '@/components/ui';
import { IconChevronLeft, IconLock } from '@/components/shell/icons';
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
  // Client briefs are projects now, with their own workspace.
  if (isClientBrief) redirect(`/projects/${id}`);
  const isFeatured = kind === 'catalog';
  const isAdmin = await isAdminView(user);
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
      <AppPage width="narrow">
        <div className="mt-10 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-14 md:py-20 text-center">
          <div className="mx-auto mb-6 w-12 h-12 rounded-full bg-[var(--signal-soft)] text-[var(--signal)] flex items-center justify-center">
            <IconLock size={18} />
          </div>
          <p className="text-[13px] text-[var(--signal)] font-medium">Roster only</p>
          <h1 className="mt-2 text-[28px] md:text-[34px] font-semibold tracking-[-0.03em]">Paid client briefs</h1>
          <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
            Get a track accepted into the catalogue and you join the roster. Paid client work opens up from there.
          </p>
          <Link href="/briefs" className={btn('primary', 'md', 'mt-8')}>
            See catalogue briefs
          </Link>
        </div>
      </AppPage>
    );
  }

  const submission = await getSubmissionStatus(briefRow.id);

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
  const credit = user ? await ensureMonthlySubmissionCredit(admin, user).catch(() => null) : null;

  const visibleRaw = (data ?? []).filter(
    (t) => isTrackPublic(privacyMap, t.id) || t.user_id === user?.id
  );

  const uploaderIds = [...new Set(visibleRaw.map((t) => t.user_id))];
  const { data: profiles } = uploaderIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', uploaderIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));

  const currentUserName = (currentProfile as { full_name?: string } | null)?.full_name ?? '';
  const submissionCredits =
    credit?.credits ?? (currentProfile as { submission_credits?: number } | null)?.submission_credits ?? 0;

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

  let submissionState: BriefPanelProps['submission'] = null;
  if (submission) {
    const latest = await admin
      .from('submissions')
      .select('id')
      .eq('brief_id', briefRow.id)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const handoff = latest.data ? readHandoffs(user!.app_metadata)[latest.data.id as string] : undefined;
    const s = composerStatus({ status: submission.status, needsSignature: submission.status === 'accepted' && !!handoff && !handoff.agreedAt });
    submissionState = { label: s.label === 'In review' ? 'Submitted · in review' : s.label, tone: s.tone, pulse: s.pulse };
  }

  const panel: BriefPanelProps = {
    briefId: briefRow.id,
    title,
    variant: isClientBrief ? 'client' : isFeatured ? 'catalog' : 'practice',
    signedIn: !!user,
    isAdmin,
    submission: submissionState,
    credits: submissionCredits,
    daysUntilNextCredit: credit?.daysUntilNext ?? null,
    deadline: brief.deadline,
    catalog: catalogPartner
      ? {
          name: catalogPartner.name,
          exclusive: catalogPartner.exclusive,
          split: catalogPartner.split,
          humanMadeOnly: catalogPartner.humanMadeOnly,
        }
      : null,
    client: isClientBrief ? { demoFee: brief.demoFee, winFee: brief.winFee } : null,
    closed,
    currentUserName,
    discoUrl,
  };

  return (
    <div className="w-full max-w-[1320px] mx-auto px-5 md:px-10 pt-5 md:pt-8 pb-36 xl:pb-24">
      <div className="no-print flex items-center justify-between gap-3 mb-6 md:mb-8">
        <Link
          href="/briefs"
          className="inline-flex items-center gap-1.5 h-8 pl-2 pr-3 -ml-2 rounded-full text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
        >
          <IconChevronLeft size={14} /> All briefs
        </Link>
        <div className="flex items-center gap-2">
          {!isClientBrief && <ShareBriefButton briefId={briefRow.id} briefName={title} loggedIn={!!user} />}
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

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-10 xl:gap-14 items-start">
        <div className="min-w-0">
          {isClientBrief && (
            <div className="no-print mb-6 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-4 text-[14px] text-[var(--text-muted)] leading-relaxed flex gap-3">
              <span className="mt-0.5 text-[var(--signal)] shrink-0">
                <IconLock size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[var(--text-primary)] font-medium">Private.</span> Paid client work stays between you and
                Thought Collective. Please do not forward this page, the PDF, or the references.
                {isAdmin && (
                  <DiscoInboxInput
                    briefId={briefRow.id}
                    currentUrl={(briefRow as { disco_inbox_url?: string | null }).disco_inbox_url ?? null}
                  />
                )}
              </div>
            </div>
          )}

          <BriefDocument brief={brief} isFeatured={isFeatured} />

          <div className="no-print xl:hidden mt-12">
            <BriefPanel {...panel} />
          </div>

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

        <aside className="no-print hidden xl:block sticky top-8">
          <BriefPanel {...panel} />
        </aside>
      </div>

      {!(isClientBrief && closed) && (
        <div className="no-print xl:hidden fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-[var(--bg-base)]/90 backdrop-blur-md border-t border-[var(--border-base)]">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium truncate">{title}</p>
              <p className="text-[12px] text-[var(--text-dim)] truncate">
                {submissionState ? submissionState.label : isClientBrief ? 'Paid client brief' : 'Catalogue brief'}
              </p>
            </div>
            <div className="shrink-0">
              <BriefPrimaryAction {...panel} size="md" full={false} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
