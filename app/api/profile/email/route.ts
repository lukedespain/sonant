import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site-url';
import { revalidatePath } from 'next/cache';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, password } = (await req.json()) as { email?: string; password?: string };
  const nextEmail = email?.trim().toLowerCase() ?? '';
  if (!EMAIL_RE.test(nextEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (nextEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: 'That is already your email.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (authError) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser(
    { email: nextEmail },
    { emailRedirectTo: `${siteUrl()}/auth/callback?next=/profile/${user.id}` }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('profiles').update({ email: nextEmail }).eq('id', user.id);

  revalidatePath(`/profile/${user.id}`);
  return NextResponse.json({ ok: true, email: nextEmail });
}
