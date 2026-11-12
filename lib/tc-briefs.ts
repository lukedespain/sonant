import type { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID } from '@/lib/admin-ids';
import { catalogPartnerFromBrief } from '@/lib/partners';
import { isBriefClosed } from '@/lib/brief-status';
import type { BriefCard } from '@/components/BriefGrid';

type AdminClient = ReturnType<typeof createAdminClient>;

type Row = {
  id: string;
  mode: string | null;
  genres: string[] | null;
  created_at: string;
  generated_content: {
    projectTitle?: string;
    codename?: string;
    logline?: string;
    project?: string;
    imageUrl?: string;
    homeFeatured?: boolean;
  } | null;
};

const FIELDS = 'id, mode, genres, created_at, generated_content';

function toCard(row: Row, closed = false): BriefCard {
  const c = row.generated_content ?? {};
  return {
    id: row.id,
    title: c.projectTitle || c.codename || 'Untitled',
    logline: c.logline || c.project || '',
    imageUrl: c.imageUrl ?? null,
    mode: row.mode ?? '',
    genres: row.genres ?? [],
    createdAt: row.created_at,
    closed,
  };
}

/** Thought Collective catalogue briefs, starred brief first, then newest. */
export async function loadCatalogueBriefs(admin: AdminClient): Promise<BriefCard[]> {
  const { data } = await admin
    .from('briefs')
    .select(FIELDS)
    .eq('user_id', ADMIN_USER_ID)
    .eq('brief_type', 'catalog')
    .order('created_at', { ascending: false })
    .returns<Row[]>();
  // Old Sonant-catalogue briefs stay out of the Thought Collective portal.
  const rows = (data ?? []).filter((r) => catalogPartnerFromBrief(r.generated_content)?.id !== 'sonant');
  const starred = rows.filter((r) => r.generated_content?.homeFeatured);
  return [...starred, ...rows.filter((r) => !r.generated_content?.homeFeatured)].map((r) => toCard(r));
}

/** Paid client briefs. Only call this for verified composers and admins. */
export async function loadClientBriefs(admin: AdminClient): Promise<BriefCard[]> {
  const { data } = await admin
    .from('briefs')
    .select(FIELDS)
    .eq('brief_type', 'client')
    .order('created_at', { ascending: false })
    .returns<Row[]>();
  return (data ?? [])
    .map((r) => toCard(r, isBriefClosed(r.generated_content)))
    .sort((a, b) => Number(a.closed) - Number(b.closed));
}
