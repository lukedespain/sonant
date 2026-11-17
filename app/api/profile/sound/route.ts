import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeSound } from '@/lib/sound';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const sound = normalizeSound(await req.json().catch(() => null));
  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, sound },
  });
  if (error) return NextResponse.json({ error: 'Could not save.' }, { status: 500 });

  revalidatePath('/briefs');
  revalidatePath('/');
  return NextResponse.json({ ok: true, sound });
}
