import type { createAdminClient } from '@/lib/supabase/admin';
import { SUBMISSION_BUCKET } from '@/lib/audio-upload';
import { readHandoffs, readRights, type RightsInfo } from '@/lib/handoff';
import { catalogPartnerById, catalogPartnerFromBrief } from '@/lib/partners';
import { classifyBrief } from '@/lib/brief-kind';
import { readTrackTags } from '@/lib/track-tags';

type AdminClient = ReturnType<typeof createAdminClient>;

export type RosterTrack = {
  submissionId: string;
  trackName: string;
  briefId: string;
  briefTitle: string;
  kind: 'catalog' | 'client';
  catalogName: string;
  mode: string;
  /** Admin tags when set, otherwise the brief's tags. */
  genres: string[];
  moods: string[];
  /** True once an admin has tagged what this track nails. */
  tagged: boolean;
  briefGenres: string[];
  briefMoods: string[];
  placedAt: string;
  signedOn: boolean;
  audioUrl: string | null;
};

export type RosterComposer = {
  id: string;
  name: string;
  email: string;
  rights: RightsInfo;
  note: string;
  tracks: RosterTrack[];
  /** Placements recorded by hand, with no track on file here. */
  outsidePlacements: number;
  lastPlacedAt: string | null;
  /** On the roster: at least one accepted catalogue track or outside placement. */
  placed: boolean;
  submissionCount: number;
  joinedAt: string | null;
};

type SubmissionRow = { id: string; user_id: string; brief_id: string; created_at: string };
type BriefRow = {
  id: string;
  user_id: string | null;
  brief_type: string | null;
  mode: string | null;
  genres: string[] | null;
  moods: string[] | null;
  generated_content: { projectTitle?: string; codename?: string; catalogId?: string } | null;
};

export function readRosterNote(appMetadata: unknown): string {
  const note = (appMetadata as { rosterNote?: unknown } | null)?.rosterNote;
  return typeof note === 'string' ? note : '';
}

function stripExtension(name: string) {
  return name.replace(/\.[^/.]+$/, '');
}

async function trackFile(admin: AdminClient, submissionId: string) {
  const { data: objects } = await admin.storage.from(SUBMISSION_BUCKET).list(submissionId, { limit: 20 });
  const file = (objects ?? []).find((entry) => entry.name && !entry.name.endsWith('/'));
  if (!file) return { name: null, url: null };
  const { data } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUrl(`${submissionId}/${file.name}`, 60 * 60 * 6);
  return { name: file.name, url: data?.signedUrl ?? null };
}

async function allAuthUsers(admin: AdminClient) {
  const users = new Map<string, { app_metadata?: unknown; user_metadata?: unknown; email?: string; created_at?: string }>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    for (const u of data.users) users.set(u.id, u);
    if (data.users.length < 1000) break;
  }
  return users;
}

/**
 * Everyone with an account. Placed composers (accepted catalogue tracks or
 * outside placements) come first, most placements first. Track tags come from
 * what an admin tagged on accept, or the brief until then.
 */
export async function loadRoster(admin: AdminClient): Promise<RosterComposer[]> {
  const [{ data: subs }, { data: allSubs }, users, { data: profileRows }] = await Promise.all([
    admin
      .from('submissions')
      .select('id, user_id, brief_id, created_at')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .returns<SubmissionRow[]>(),
    admin.from('submissions').select('user_id'),
    allAuthUsers(admin),
    admin.from('profiles').select('id, full_name, email, created_at'),
  ]);
  const acceptedAll = subs ?? [];

  const manual = await admin
    .from('profiles')
    .select('id, manual_catalog_placements')
    .gt('manual_catalog_placements', 0);
  const manualRows = (manual.error ? [] : manual.data ?? []) as { id: string; manual_catalog_placements: number }[];

  const profiles = (profileRows ?? []) as { id: string; full_name: string | null; email: string | null; created_at?: string | null }[];
  const userIds = [...new Set([...profiles.map((p) => p.id), ...acceptedAll.map((s) => s.user_id)])];
  if (userIds.length === 0) return [];

  const briefIds = [...new Set(acceptedAll.map((s) => s.brief_id))];
  const [{ data: briefs }, files] = await Promise.all([
    briefIds.length
      ? admin
          .from('briefs')
          .select('id, user_id, brief_type, mode, genres, moods, generated_content')
          .in('id', briefIds)
          .returns<BriefRow[]>()
      : Promise.resolve({ data: [] as BriefRow[] }),
    Promise.all(acceptedAll.map(async (s) => [s.id, await trackFile(admin, s.id)] as const)),
  ]);

  const briefMapAll = new Map((briefs ?? []).map((b) => [b.id, b]));
  // Client project wins are not catalogue placements.
  const accepted = acceptedAll.filter((s) => {
    const b = briefMapAll.get(s.brief_id);
    return !b || classifyBrief(b) !== 'client';
  });
  const submissionCounts = new Map<string, number>();
  for (const row of (allSubs ?? []) as { user_id: string }[]) {
    submissionCounts.set(row.user_id, (submissionCounts.get(row.user_id) ?? 0) + 1);
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const briefMap = briefMapAll;
  const userMap = users;
  const fileMap = new Map(files);
  const manualMap = new Map(manualRows.map((m) => [m.id, Math.floor(m.manual_catalog_placements)]));
  return userIds
    .map((id): RosterComposer => {
      const profile = profileMap.get(id);
      const authUser = userMap.get(id);
      const handoffs = readHandoffs(authUser?.app_metadata);
      const trackTags = readTrackTags(authUser?.app_metadata);
      const tracks = accepted
        .filter((s) => s.user_id === id)
        .map((s): RosterTrack => {
          const brief = briefMap.get(s.brief_id);
          const content = brief?.generated_content ?? null;
          const handoff = handoffs[s.id];
          const isClient = brief ? classifyBrief(brief) === 'client' : false;
          const partner =
            catalogPartnerById(handoff?.catalogId) ?? catalogPartnerFromBrief(content) ?? catalogPartnerById('thought-collective');
          const file = fileMap.get(s.id);
          const saved = trackTags[s.id];
          return {
            submissionId: s.id,
            trackName: file?.name ? stripExtension(file.name) : 'Untitled track',
            briefId: s.brief_id,
            briefTitle: content?.projectTitle || content?.codename || 'Untitled brief',
            kind: isClient ? 'client' : 'catalog',
            catalogName: isClient ? 'Client job' : partner?.name ?? 'Thought Collective',
            mode: brief?.mode ?? '',
            genres: saved ? saved.genres : brief?.genres ?? [],
            moods: saved ? saved.moods : brief?.moods ?? [],
            tagged: !!saved,
            briefGenres: brief?.genres ?? [],
            briefMoods: brief?.moods ?? [],
            placedAt: handoff?.offeredAt || s.created_at,
            signedOn: !!handoff?.agreedAt,
            audioUrl: file?.url ?? null,
          };
        })
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
      return {
        id,
        name: profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'Unnamed composer',
        email: profile?.email ?? authUser?.email ?? '',
        rights: readRights(authUser?.user_metadata),
        note: readRosterNote(authUser?.app_metadata),
        tracks,
        outsidePlacements: manualMap.get(id) ?? 0,
        lastPlacedAt: tracks[0]?.placedAt ?? null,
        placed: tracks.length + (manualMap.get(id) ?? 0) > 0,
        submissionCount: submissionCounts.get(id) ?? 0,
        joinedAt: profile?.created_at ?? authUser?.created_at ?? null,
      };
    })
    .sort(
      (a, b) =>
        b.tracks.length + b.outsidePlacements - (a.tracks.length + a.outsidePlacements) ||
        (b.lastPlacedAt ?? '').localeCompare(a.lastPlacedAt ?? '') ||
        b.submissionCount - a.submissionCount ||
        (b.joinedAt ?? '').localeCompare(a.joinedAt ?? ''),
    );
}
