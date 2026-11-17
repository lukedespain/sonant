import type { SupabaseClient } from '@supabase/supabase-js';
import { isBriefClosed } from '@/lib/brief-status';
import { readTrackTags } from '@/lib/track-tags';
import { SUBMISSION_BUCKET } from '@/lib/audio-upload';

/**
 * Client projects are client briefs (brief_type 'client') that admins send to
 * chosen roster composers. Invites live on the brief's generated_content; each
 * composer's thread with Thought Collective is a JSON file in storage, next to
 * the notification lists.
 */

const BUCKET = 'community-tracks';

export type ProjectInvite = { composerId: string; invitedAt: string };

export type ProjectMessage = {
  id: string;
  author: 'admin' | 'composer';
  authorName: string;
  body: string;
  createdAt: string;
  /** Set when the message is about one uploaded version. */
  submissionId?: string;
};

export type ProjectThread = {
  messages: ProjectMessage[];
  /** Last time each side opened the thread. */
  readAt: { admin?: string; composer?: string };
};

export type ProjectSummary = {
  id: string;
  title: string;
  client: string;
  logline: string;
  imageUrl: string | null;
  deadline: string | null;
  demoFee: string | null;
  winFee: string | null;
  genres: string[];
  moods: string[];
  closed: boolean;
  createdAt: string;
  invites: ProjectInvite[];
};

type BriefRow = {
  id: string;
  created_at: string;
  genres: string[] | null;
  moods: string[] | null;
  generated_content: Record<string, unknown> | null;
};

export function readInvites(content: unknown): ProjectInvite[] {
  const raw = (content as { invites?: unknown } | null)?.invites;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i): i is ProjectInvite => !!i && typeof i === 'object' && typeof (i as ProjectInvite).composerId === 'string',
  );
}

export function isInvited(content: unknown, userId: string | null | undefined) {
  return !!userId && readInvites(content).some((i) => i.composerId === userId);
}

function str(v: unknown) {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function toProjectSummary(row: BriefRow): ProjectSummary {
  const c = row.generated_content ?? {};
  return {
    id: row.id,
    title: str(c.projectTitle) ?? str(c.codename) ?? 'Untitled project',
    client: str(c.client) ?? '',
    logline: str(c.logline) ?? str(c.ask) ?? str(c.project) ?? '',
    imageUrl: str(c.imageUrl),
    deadline: str(c.deadline),
    demoFee: str(c.demoFee),
    winFee: str(c.winFee),
    genres: row.genres ?? [],
    moods: row.moods ?? [],
    closed: isBriefClosed(c),
    createdAt: row.created_at,
    invites: readInvites(c),
  };
}

export async function loadProjects(admin: SupabaseClient, forComposer?: string): Promise<ProjectSummary[]> {
  const { data } = await admin
    .from('briefs')
    .select('id, created_at, genres, moods, generated_content')
    .eq('brief_type', 'client')
    .order('created_at', { ascending: false })
    .returns<BriefRow[]>();
  return (data ?? [])
    .filter((row) => !forComposer || isInvited(row.generated_content, forComposer))
    .map(toProjectSummary)
    .sort((a, b) => Number(a.closed) - Number(b.closed));
}

/* ---------------- Threads ---------------- */

function threadKey(projectId: string, composerId: string) {
  return `_meta/projects/${projectId}/${composerId}.json`;
}

export async function readThread(admin: SupabaseClient, projectId: string, composerId: string): Promise<ProjectThread> {
  const { data, error } = await admin.storage.from(BUCKET).download(threadKey(projectId, composerId));
  if (error || !data) return { messages: [], readAt: {} };
  try {
    const parsed = JSON.parse(await data.text()) as Partial<ProjectThread>;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      readAt: parsed.readAt && typeof parsed.readAt === 'object' ? parsed.readAt : {},
    };
  } catch {
    return { messages: [], readAt: {} };
  }
}

async function writeThread(admin: SupabaseClient, projectId: string, composerId: string, thread: ProjectThread) {
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(threadKey(projectId, composerId), JSON.stringify(thread), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0',
    });
  if (error) throw new Error(error.message);
}

export async function appendMessage(
  admin: SupabaseClient,
  projectId: string,
  composerId: string,
  input: Omit<ProjectMessage, 'id' | 'createdAt'>,
) {
  const thread = await readThread(admin, projectId, composerId);
  const message: ProjectMessage = {
    ...input,
    body: input.body.slice(0, 4000),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  thread.messages.push(message);
  // Writing counts as reading your own side.
  thread.readAt[input.author] = message.createdAt;
  await writeThread(admin, projectId, composerId, thread);
  return message;
}

export async function markThreadRead(
  admin: SupabaseClient,
  projectId: string,
  composerId: string,
  side: 'admin' | 'composer',
) {
  const thread = await readThread(admin, projectId, composerId);
  const last = thread.messages[thread.messages.length - 1];
  if (!last || (thread.readAt[side] && thread.readAt[side]! >= last.createdAt)) return thread;
  thread.readAt[side] = new Date().toISOString();
  await writeThread(admin, projectId, composerId, thread).catch(() => undefined);
  return thread;
}

export function unreadFor(thread: ProjectThread, side: 'admin' | 'composer') {
  const other = side === 'admin' ? 'composer' : 'admin';
  const seen = thread.readAt[side] ?? '';
  return thread.messages.filter((m) => m.author === other && m.createdAt > seen).length;
}

/* ---------------- Matching ---------------- */

export type ComposerMatch = {
  id: string;
  name: string;
  email: string;
  placements: number;
  matched: string[];
  tags: string[];
  score: number;
};

/**
 * Roster composers ranked for a project: shared genre and mood tags from their
 * accepted tracks first, then number of placements.
 */
export async function matchComposers(
  admin: SupabaseClient,
  project: { genres: string[]; moods: string[] },
): Promise<ComposerMatch[]> {
  const { data: subs } = await admin
    .from('submissions')
    .select('id, user_id, brief_id')
    .eq('status', 'accepted');
  const accepted = (subs ?? []) as { id: string; user_id: string; brief_id: string }[];
  const { data: manual } = await admin
    .from('profiles')
    .select('id, manual_catalog_placements')
    .gt('manual_catalog_placements', 0);
  const manualRows = (manual ?? []) as { id: string; manual_catalog_placements: number }[];

  const ids = [...new Set([...accepted.map((s) => s.user_id), ...manualRows.map((m) => m.id)])];
  if (ids.length === 0) return [];
  const briefIds = [...new Set(accepted.map((s) => s.brief_id))];

  const [{ data: profiles }, { data: briefs }, users] = await Promise.all([
    admin.from('profiles').select('id, full_name, email').in('id', ids),
    briefIds.length
      ? admin.from('briefs').select('id, genres, moods, brief_type').in('id', briefIds)
      : Promise.resolve({ data: [] }),
    Promise.all(ids.map(async (id) => [id, (await admin.auth.admin.getUserById(id)).data?.user ?? null] as const)),
  ]);
  const briefMap = new Map(
    ((briefs ?? []) as { id: string; genres: string[] | null; moods: string[] | null; brief_type: string | null }[]).map(
      (b) => [b.id, b],
    ),
  );
  const userMap = new Map(users);
  const want = new Set([...project.genres, ...project.moods].map((t) => t.toLowerCase()));

  return ids
    .map((id): ComposerMatch => {
      const p = ((profiles ?? []) as { id: string; full_name: string | null; email: string | null }[]).find(
        (x) => x.id === id,
      );
      const tagMap = readTrackTags(userMap.get(id)?.app_metadata);
      const mine = accepted.filter((s) => s.user_id === id);
      const tags = new Set<string>();
      for (const s of mine) {
        const saved = tagMap[s.id];
        const brief = briefMap.get(s.brief_id);
        for (const t of saved ? [...saved.genres, ...saved.moods] : [...(brief?.genres ?? []), ...(brief?.moods ?? [])]) {
          tags.add(t);
        }
      }
      const matched = [...tags].filter((t) => want.has(t.toLowerCase()));
      const placements = mine.length + (manualRows.find((m) => m.id === id)?.manual_catalog_placements ?? 0);
      return {
        id,
        name: p?.full_name?.trim() || p?.email?.split('@')[0] || 'Composer',
        email: p?.email ?? '',
        placements,
        matched,
        tags: [...tags],
        score: matched.length * 10 + placements,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/* ---------------- Versions (uploads) ---------------- */

export type ProjectVersion = {
  id: string;
  composerId: string;
  trackName: string;
  status: string;
  createdAt: string;
  audioUrl: string | null;
  downloadHref: string | null;
};

export async function loadVersions(
  admin: SupabaseClient,
  projectId: string,
  composerId?: string,
): Promise<ProjectVersion[]> {
  let query = admin
    .from('submissions')
    .select('id, user_id, status, created_at, delivery')
    .eq('brief_id', projectId)
    .order('created_at', { ascending: false });
  if (composerId) query = query.eq('user_id', composerId);
  const { data } = await query;
  const rows = ((data ?? []) as { id: string; user_id: string; status: string; created_at: string; delivery?: string | null }[]).filter(
    (r) => r.delivery !== 'disco',
  );
  return Promise.all(
    rows.map(async (r) => {
      const { data: objects } = await admin.storage.from(SUBMISSION_BUCKET).list(r.id, { limit: 10 });
      const file = (objects ?? []).find((o) => o.name && !o.name.endsWith('/'));
      let audioUrl: string | null = null;
      if (file) {
        const { data: signed } = await admin.storage.from(SUBMISSION_BUCKET).createSignedUrl(`${r.id}/${file.name}`, 60 * 60 * 6);
        audioUrl = signed?.signedUrl ?? null;
      }
      return {
        id: r.id,
        composerId: r.user_id,
        trackName: file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Untitled version',
        status: r.status,
        createdAt: r.created_at,
        audioUrl,
        downloadHref: file ? `/api/admin/submissions/${r.id}/download` : null,
      };
    }),
  );
}
