import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { account_type } = await req.json();
  if (account_type !== 'composer' && account_type !== 'business') {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
  }

  // Store in user_metadata (accessible without DB query on the client)
  await supabase.auth.updateUser({ data: { account_type } });

  // Store in profiles table (authoritative source)
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ account_type })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
