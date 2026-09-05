import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS, ADMIN_USER_ID } from '@/lib/admin';
import {
  sendFeaturedBriefAnnouncementEmail,
  sendPaidBriefAnnouncementEmail,
} from '@/lib/email';
import { isVerifiedComposer, type VerifiedOverride } from '@/lib/verification';
import { siteUrl } from '@/lib/site-url';

const BUCKET = 'community-tracks';
const KEY = '_meta/brief-announcements.json';
const PAGE = 1000;

type AnnouncementKind = 'client' | 'featured';

type ProfileRow = {
  id: string;
  email: string | null;
  verified_override?: boolean | null;
  manual_catalog_placements?: number | null;
};

function overrideFrom(value: boolean | null | undefined): VerifiedOverride {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function skipEmail(email: string) {
  const lower = email.toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(lower);
}

async function readAnnounced(admin: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await admin.storage.from(BUCKET).download(KEY);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text()) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeAnnounced(admin: SupabaseClient, map: Record<string, string>) {
  const { error } = await admin.storage.from(BUCKET).upload(KEY, JSON.stringify(map), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) throw new Error(error.message);
}

async function listProfiles(admin: SupabaseClient): Promise<ProfileRow[]> {
  const full =
    'id, email, verified_override, manual_catalog_placements';
  const fallback = 'id, email';
  const rows: ProfileRow[] = [];
  let select = full;
  let from = 0;

  while (true) {
    const query = await admin.from('profiles').select(select).range(from, from + PAGE - 1);
    if (query.error && select === full) {
      select = fallback;
      from = 0;
      rows.length = 0;
      continue;
    }
    if (query.error) {
      console.error('Could not list profiles for brief announcement:', query.error);
      return rows;
    }
    const page = (query.data ?? []) as unknown as ProfileRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }

  return rows;
}

async function acceptedOnBriefsFor(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;

  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200);
    const { data } = await admin
      .from('submissions')
      .select('user_id, briefs!inner(brief_type)')
      .in('user_id', chunk)
      .eq('status', 'accepted')
      .neq('briefs.brief_type', 'client');
    for (const row of data ?? []) {
      const id = (row as { user_id: string }).user_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return counts;
}

async function recipientEmails(
  admin: SupabaseClient,
  kind: AnnouncementKind
): Promise<string[]> {
  const profiles = (await listProfiles(admin)).filter((row) => {
    if (row.id === ADMIN_USER_ID) return false;
    const email = row.email?.trim().toLowerCase() ?? '';
    return !!email && !skipEmail(email);
  });

  if (kind === 'featured') {
    return [...new Set(profiles.map((row) => row.email!.trim().toLowerCase()))];
  }

  const acceptedMap = await acceptedOnBriefsFor(
    admin,
    profiles.map((row) => row.id)
  );
  return [
    ...new Set(
      profiles
        .filter((row) => {
          const manual = Math.max(0, Math.floor(row.manual_catalog_placements ?? 0));
          return isVerifiedComposer(
            (acceptedMap.get(row.id) ?? 0) + manual,
            overrideFrom(row.verified_override)
          );
        })
        .map((row) => row.email!.trim().toLowerCase())
    ),
  ];
}

async function sendChunked(
  emails: string[],
  sendOne: (to: string) => Promise<{ error?: string }>
) {
  const size = 6;
  let sent = 0;
  for (let i = 0; i < emails.length; i += size) {
    const chunk = emails.slice(i, i + size);
    const results = await Promise.all(chunk.map((to) => sendOne(to)));
    sent += results.filter((result) => !result.error).length;
  }
  return sent;
}

export async function announceNewBrief(params: {
  admin: SupabaseClient;
  kind: AnnouncementKind;
  briefId: string;
  briefName: string;
  force?: boolean;
}): Promise<{ sent: number; skipped?: boolean; error?: string }> {
  const announced = await readAnnounced(params.admin);
  if (!params.force && announced[params.briefId]) {
    return { sent: 0, skipped: true };
  }

  const emails = await recipientEmails(params.admin, params.kind);
  const briefName = params.briefName.trim() || 'Untitled brief';
  const briefUrl = `${siteUrl()}/browse/${params.briefId}`;
  const sendOne =
    params.kind === 'client'
      ? (to: string) => sendPaidBriefAnnouncementEmail({ to, briefName, briefUrl })
      : (to: string) => sendFeaturedBriefAnnouncementEmail({ to, briefName, briefUrl });

  const sent = await sendChunked(emails, sendOne);
  announced[params.briefId] = new Date().toISOString();
  try {
    await writeAnnounced(params.admin, announced);
  } catch (error) {
    console.error('Could not mark brief as announced:', error);
  }

  return { sent };
}

export function briefDisplayName(content: {
  projectTitle?: string;
  project?: string;
  client?: string;
  codename?: string;
} | null | undefined) {
  return (
    content?.projectTitle?.trim() ||
    content?.project?.trim() ||
    content?.client?.trim() ||
    content?.codename?.trim() ||
    'Untitled brief'
  );
}
