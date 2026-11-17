import Link from 'next/link';
import QueueKeys from '@/components/QueueKeys';
import { EmptyState, SectionHeader } from '@/components/ui';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSubmissionCard from '@/components/AdminSubmissionCard';
import { SUBMISSION_BUCKET } from '@/lib/audio-upload';
import { catalogPartnerById, catalogPartnerFromBrief } from '@/lib/partners';
import { readHandoffs, readRights } from '@/lib/handoff';
import { readTrackTags } from '@/lib/track-tags';
import type { AdminHandoff } from '@/components/AdminSubmissionCard';
import ManualSubmissionForm, { type ComposerOption } from './ManualSubmissionForm';

type Queue = 'catalog' | 'client';

type BriefContent = {
  codename?: string;
  projectTitle?: string;
  kind?: string;
} | null;

function isClientBrief(briefType: string | null | undefined, content: BriefContent) {
  return briefType === 'client' || content?.kind === 'client';
}

function projectName(content: BriefContent, isClient: boolean) {
  if (isClient && content?.projectTitle) return content.projectTitle;
  return content?.codename ?? 'Untitled';
}

function namesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const strip = (value: string) => value.replace(/\.[^/.]+$/, '').trim().toLowerCase();
  return strip(a) === strip(b);
}

async function signedSubmissionAudio(
  admin: ReturnType<typeof createAdminClient>,
  submissionId: string,
) {
  const { data: objects } = await admin.storage.from(SUBMISSION_BUCKET).list(submissionId, { limit: 20 });
  const file = (objects ?? []).find((entry) => entry.name && !entry.name.endsWith('/'));
  if (!file) return null;
  const { data } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUrl(`${submissionId}/${file.name}`, 60 * 60 * 6);
  if (!data?.signedUrl) return null;
  return { url: data.signedUrl, name: file.name };
}

export default async function SubmissionsTab({ queue = 'catalog' }: { queue?: Queue }) {
  const admin = createAdminClient();
  type SubmissionRow = {
    id: string;
    brief_id: string;
    user_id: string;
    status: string;
    feedback: string | null;
    created_at: string;
    delivery?: string | null;
    disco_inbox_url?: string | null;
    delivery_confirmed_at?: string | null;
  };
  const full = await admin
    .from('submissions')
    .select('id, brief_id, user_id, status, feedback, created_at, delivery, disco_inbox_url, delivery_confirmed_at')
    .order('created_at', { ascending: false });
  const fallback = full.error
    ? await admin
        .from('submissions')
        .select('id, brief_id, user_id, status, feedback, created_at')
        .order('created_at', { ascending: false })
    : null;
  const rows = ((full.error ? fallback?.data : full.data) ?? []) as SubmissionRow[];
  const userIds = [...new Set(rows.map((s) => s.user_id))];
  const briefIds = [...new Set(rows.map((s) => s.brief_id))];

  const [{ data: profiles }, { data: briefs }, { data: playlistTracks }] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    briefIds.length
      ? admin.from('briefs').select('id, brief_type, genres, moods, generated_content').in('id', briefIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin
          .from('community_tracks')
          .select('id, user_id, brief_id, file_name, file_url')
          .in('user_id', userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [
      p.id,
      { name: p.full_name ?? '', email: p.email ?? 'unknown' },
    ])
  );
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b: { id: string; brief_type?: string | null; genres?: string[] | null; moods?: string[] | null; generated_content: BriefContent }) => {
      const content = b.generated_content;
      const client = isClientBrief(b.brief_type, content);
      return [
        b.id,
        {
          isClient: client,
          name: projectName(content, client),
          catalogId: catalogPartnerFromBrief(content)?.id ?? 'sonant',
          genres: b.genres ?? [],
          moods: b.moods ?? [],
        },
      ];
    })
  );

  type PlaylistTrack = {
    id: string;
    user_id: string;
    brief_id: string;
    file_name: string | null;
    file_url: string | null;
  };
  const playlist = (playlistTracks ?? []) as PlaylistTrack[];

  function matchPlaylist(userId: string, briefId: string, fileName?: string | null) {
    const same = playlist.filter((track) => track.user_id === userId && track.brief_id === briefId);
    if (fileName) {
      const named = same.find((track) => namesMatch(track.file_name, fileName));
      if (named) return named;
    }
    return same[0] ?? null;
  }

  const queueOwners = [...new Set(rows.filter((r) => r.status !== 'not_accepted').map((r) => r.user_id))];
  const authUsers = Object.fromEntries(
    await Promise.all(
      queueOwners.map(async (id) => [id, (await admin.auth.admin.getUserById(id)).data?.user ?? null] as const)
    )
  );
  function handoffFor(sub: SubmissionRow): AdminHandoff | null {
    if (sub.status !== 'accepted') return null;
    const owner = authUsers[sub.user_id];
    const record = readHandoffs(owner?.app_metadata)[sub.id];
    if (!record?.offeredAt) return null;
    return {
      agreedAt: record.agreedAt ?? null,
      stemsUrl: record.stemsUrl ?? null,
      humanMade: record.humanMade === true,
      noStems: record.noStems === true,
      rights: record.agreedAt ? readRights(owner?.user_metadata) : null,
    };
  }

  const audioBySubmission = Object.fromEntries(
    await Promise.all(
      rows
        .filter((sub) => sub.delivery !== 'disco')
        .map(async (sub) => [sub.id, await signedSubmissionAudio(admin, sub.id)] as const)
    )
  );

  const cards = rows.map((sub) => {
    const brief = briefMap[sub.brief_id] ?? { isClient: false, name: 'Untitled', catalogId: 'sonant', genres: [] as string[], moods: [] as string[] };
    const delivery: 'upload' | 'disco' = sub.delivery === 'disco' ? 'disco' : 'upload';
    const signed = audioBySubmission[sub.id] ?? null;
    const playlistHit = matchPlaylist(sub.user_id, sub.brief_id, signed?.name);
    return {
      id: sub.id,
      briefId: sub.brief_id,
      projectName: brief.name,
      isClient: brief.isClient,
      catalogId:
        catalogPartnerById(readHandoffs(authUsers[sub.user_id]?.app_metadata)[sub.id]?.catalogId)?.id ?? brief.catalogId,
      composerEmail: profileMap[sub.user_id]?.email ?? 'unknown',
      composerName: profileMap[sub.user_id]?.name ?? '',
      status: sub.status,
      feedback: sub.feedback ?? null,
      submittedAt: new Date(sub.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      delivery,
      discoInboxUrl: sub.disco_inbox_url ?? null,
      deliveryConfirmedAt: sub.delivery_confirmed_at ?? null,
      audioUrl: signed?.url ?? playlistHit?.file_url ?? null,
      audioName: signed?.name || playlistHit?.file_name || null,
      downloadHref: signed
        ? `/api/admin/submissions/${sub.id}/download`
        : playlistHit?.file_url ?? null,
      playlistHref: playlistHit ? `/briefs/${sub.brief_id}#playlist` : null,
      handoff: handoffFor(sub),
      briefGenres: brief.genres,
      briefMoods: brief.moods,
      savedTags: readTrackTags(authUsers[sub.user_id]?.app_metadata)[sub.id] ?? null,
    };
  });

  const catalogCards = cards.filter((row) => !row.isClient);
  const clientCards = cards.filter((row) => row.isClient);
  const visible = queue === 'client' ? clientCards : catalogCards;


  const { data: composerRows } =
    queue === 'catalog'
      ? await admin.from('profiles').select('full_name, email').not('email', 'is', null).order('full_name')
      : { data: [] };
  const composers: ComposerOption[] = (composerRows ?? []).map((p: { full_name: string | null; email: string }) => ({
    email: p.email,
    name: p.full_name ?? '',
  }));

  const stage = (row: (typeof cards)[number]) => {
    if (row.delivery === 'disco') return row.deliveryConfirmedAt ? 2 : 0;
    if (row.status === 'accepted' || row.status === 'not_accepted') return 2;
    return row.status === 'sent_to_catalog' ? 1 : 0;
  };
  const ordered = [...visible].sort((a, b) => stage(a) - stage(b));

  const clientPending = clientCards.filter((row) =>
    row.delivery === 'disco' ? !row.deliveryConfirmedAt : row.status !== 'accepted' && row.status !== 'not_accepted'
  ).length;

  const groups = [
    { stage: 0, title: 'To review', description: undefined },
    { stage: 1, title: 'Shortlisted', description: undefined },
    { stage: 2, title: 'Decided', description: undefined },
  ];

  const card = (row: (typeof cards)[number]) => (
    <AdminSubmissionCard
      key={`${row.id}:${row.status}:${row.deliveryConfirmedAt ?? ''}`}
      submissionId={row.id}
      briefId={row.briefId}
      projectName={row.projectName}
      composerEmail={row.composerName ? `${row.composerName} · ${row.composerEmail}` : row.composerEmail}
      status={row.status}
      existingFeedback={row.feedback}
      submittedAt={row.submittedAt}
      briefType={row.isClient ? 'client' : 'catalog'}
      delivery={row.delivery}
      discoInboxUrl={row.discoInboxUrl}
      deliveryConfirmedAt={row.deliveryConfirmedAt}
      audioUrl={row.audioUrl}
      audioName={row.audioName}
      downloadHref={row.downloadHref}
      playlistHref={row.playlistHref}
      catalogId={row.catalogId}
      handoff={row.handoff}
      briefGenres={row.briefGenres}
      briefMoods={row.briefMoods}
      savedTags={row.savedTags}
    />
  );

  return (
    <div>
      {clientPending > 0 && (
        <Link
          href="/projects"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[var(--signal-line)] bg-[var(--signal-soft)] px-5 py-3.5 text-[14px] hover:border-[var(--signal)] transition-colors"
        >
          <span>
            {clientPending} project {clientPending === 1 ? 'version is' : 'versions are'} waiting for you
          </span>
          <span className="text-[var(--signal)]">Open projects →</span>
        </Link>
      )}

      {queue === 'catalog' && <ManualSubmissionForm composers={composers} />}

      {ordered.length === 0 ? (
        <EmptyState
          title="Nothing to review" 
          body="New tracks land here the moment a composer submits."
        />
      ) : (
        <QueueKeys>
        <div className="flex flex-col gap-10">
          {groups.map((group) => {
            const rows = ordered.filter((row) => stage(row) === group.stage);
            if (rows.length === 0) return null;
            return (
              <section key={group.stage}>
                <SectionHeader title={group.title} count={rows.length} description={group.description} />
                <div className="flex flex-col gap-2">{rows.map(card)}</div>
              </section>
            );
          })}
        </div>
        </QueueKeys>
      )}
    </div>
  );
}
