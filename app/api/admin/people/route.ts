import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { isVerifiedComposer, type VerifiedOverride } from '@/lib/verification';
import type { AdminPerson } from '@/lib/admin-people';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  submission_credits?: number | null;
  session_credits?: number | null;
  verified_override?: boolean | null;
  manual_catalog_placements?: number | null;
};

function sanitizeIlike(value: string) {
  return value.replace(/[%_*,\\]/g, '').trim();
}

function overrideFrom(value: boolean | null | undefined): VerifiedOverride {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

async function acceptedOnBriefsFor(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;
  const { data } = await admin
    .from('submissions')
    .select('user_id, briefs!inner(brief_type)')
    .in('user_id', userIds)
    .eq('status', 'accepted')
    .neq('briefs.brief_type', 'client');
  for (const row of data ?? []) {
    const id = (row as { user_id: string }).user_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function toPerson(row: ProfileRow, acceptedOnBriefs: number): AdminPerson {
  const manual = Math.max(0, Math.floor(row.manual_catalog_placements ?? 0));
  const override = overrideFrom(row.verified_override);
  const accepted = acceptedOnBriefs + manual;
  return {
    id: row.id,
    name: row.full_name?.trim() || 'Composer',
    email: row.email ?? '',
    avatarUrl: row.avatar_url ?? null,
    submissionCredits: row.submission_credits ?? 0,
    sessionCredits: row.session_credits ?? 0,
    acceptedOnBriefs,
    manualPlacements: manual,
    accepted,
    override,
    verified: isVerifiedComposer(accepted, override),
  };
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id')?.trim() ?? '';
  const q = sanitizeIlike(url.searchParams.get('q') ?? '');
  const admin = createAdminClient();

  const fullSelect =
    'id, full_name, email, avatar_url, submission_credits, session_credits, verified_override, manual_catalog_placements';
  const fallbackSelect = 'id, full_name, email, avatar_url, submission_credits, session_credits';

  let query = admin.from('profiles').select(fullSelect);
  if (id) {
    query = query.eq('id', id);
  } else if (q.length >= 2) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`).limit(20);
  } else {
    query = query.order('full_name', { ascending: true, nullsFirst: false }).limit(20);
  }

  const full = await query;
  let rows: ProfileRow[];
  if (full.error) {
    let fallback = admin.from('profiles').select(fallbackSelect);
    if (id) fallback = fallback.eq('id', id);
    else if (q.length >= 2) fallback = fallback.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`).limit(20);
    else fallback = fallback.order('full_name', { ascending: true, nullsFirst: false }).limit(20);
    const reduced = await fallback;
    if (reduced.error) {
      return NextResponse.json({ error: reduced.error.message }, { status: 500 });
    }
    rows = (reduced.data ?? []) as ProfileRow[];
  } else {
    rows = (full.data ?? []) as ProfileRow[];
  }
  const acceptedMap = await acceptedOnBriefsFor(
    admin,
    rows.map((row) => row.id)
  );
  const people = rows.map((row) => toPerson(row, acceptedMap.get(row.id) ?? 0));

  return NextResponse.json({ people });
}
