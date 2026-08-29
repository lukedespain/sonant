import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const delta = body.delta === -1 ? -1 : body.delta === 1 ? 1 : 0;
  if (!userId) return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
  if (delta === 0) {
    return NextResponse.json({ error: 'delta must be 1 or -1.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: readError } = await admin
    .from('profiles')
    .select('manual_catalog_placements')
    .eq('id', userId)
    .maybeSingle();

  if (readError) {
    if (/manual_catalog_placements/i.test(readError.message ?? '')) {
      return NextResponse.json(
        { error: 'Run the manual placements SQL in the dashboard first.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }

  const current = Math.max(
    0,
    Math.floor((profile as { manual_catalog_placements?: number | null }).manual_catalog_placements ?? 0)
  );
  const next = Math.max(0, current + delta);
  if (next === current) {
    return NextResponse.json({ success: true, manualPlacements: current });
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ manual_catalog_placements: next })
    .eq('id', userId);

  if (updateError) {
    if (/manual_catalog_placements/i.test(updateError.message ?? '')) {
      return NextResponse.json(
        { error: 'Run the manual placements SQL in the dashboard first.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath(`/profile/${userId}`);
  revalidatePath('/browse');
  return NextResponse.json({ success: true, manualPlacements: next });
}
