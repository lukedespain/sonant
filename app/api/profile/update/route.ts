import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { full_name, bio, website } = await req.json() as {
    full_name?: string;
    bio?: string;
    website?: string;
  };
  if (!full_name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const admin = createAdminClient();
  const withPublic = {
    full_name: full_name.trim(),
    bio: typeof bio === 'string' ? bio.trim() : undefined,
    website: typeof website === 'string' ? website.trim() : undefined,
  };

  let { error } = await admin.from('profiles').update(withPublic).eq('id', user.id);

  if (error && /bio|website/i.test(error.message)) {
    const retry = await admin
      .from('profiles')
      .update({ full_name: full_name.trim() })
      .eq('id', user.id);
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/account');
  revalidatePath(`/profile/${user.id}`);
  return NextResponse.json({ ok: true });
}
