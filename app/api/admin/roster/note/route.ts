import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';

/** Saves the private admin note on a roster composer (auth app_metadata.rosterNote). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { userId?: string; note?: string } | null;
  const userId = body?.userId ?? '';
  const note = (body?.note ?? '').slice(0, 2000);
  if (!userId) return NextResponse.json({ error: 'Missing composer.' }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!data?.user) return NextResponse.json({ error: 'Composer not found.' }, { status: 404 });

  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...data.user.app_metadata, rosterNote: note },
  });
  if (error) return NextResponse.json({ error: 'Could not save the note.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
