import type { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID } from '@/lib/admin-ids';
import { catalogPartnerFromBrief } from '@/lib/partners';
import type { BriefCard } from '@/components/BriefGrid';

type AdminClient = ReturnType<typeof createAdminClient>;

type Row = {
  id: string;
  mode: string | null;
  genres: string[] | null;
  moods: string[] | null;
  created_at: string;
  generated_content: {
    projectTitle?: string;
    codename?: string;
    logline?: string;
    project?: string;
    imageUrl?: string;
    homeFeatured?: boolean;
    vocals?: string;
    references?: { track?: string }[];
  } | null;
};

const FIELDS = 'id, mode, genres, moods, created_at, generated_content';

/** Briefs describe vocals in free text; boil it down for the filter. */
function vocalKind(raw: string | undefined): 'Instrumental' | 'Vocals' | 'Either' | null {
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (/instrumental or vocal|either|optional/.test(t)) return 'Either';
  if (t.startsWith('instrumental') || /no (vocals|singing)/.test(t)) return 'Instrumental';
  if (/vocal|sung|singing|lyric/.test(t)) return 'Vocals';
  return null;
}

function toCard(row: Row, closed = false): BriefCard {
  const c = row.generated_content ?? {};
  return {
    id: row.id,
    title: c.projectTitle || c.codename || 'Untitled',
    logline: c.logline || c.project || '',
    imageUrl: c.imageUrl ?? null,
    mode: row.mode ?? '',
    genres: row.genres ?? [],
    moods: row.moods ?? [],
    createdAt: row.created_at,
    closed,
    featured: !!c.homeFeatured,
    vocals: vocalKind(c.vocals),
    references: (c.references ?? []).map((r) => r.track ?? '').filter(Boolean),
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
