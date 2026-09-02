import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteUserAccount } from '@/lib/account';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { password, confirm } = (await req.json()) as { password?: string; confirm?: string };
  if (confirm?.trim().toUpperCase() !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (authError) {
    return NextResponse.json({ error: 'Password is incorrect.' }, { status: 401 });
  }

  const result = await deleteUserAccount(createAdminClient(), user.id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
