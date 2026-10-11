import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeRights, readRights, validateRights } from '@/lib/handoff';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save your info.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rights = normalizeRights(readRights({ rights: body }));
  const problem = validateRights(rights);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, rights },
  });
  if (error) return NextResponse.json({ error: 'Could not save your info.' }, { status: 500 });

  revalidatePath('/dashboard');
  return NextResponse.json({ ok: true, rights });
}
