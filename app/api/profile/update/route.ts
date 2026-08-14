import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function normalizeWebsite(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

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
  const nextBio = typeof bio === 'string' ? bio.trim() : undefined;
  const nextWebsite = typeof website === 'string' ? normalizeWebsite(website) : undefined;

  const { error } = await admin
    .from('profiles')
    .update({ full_name: full_name.trim() })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: full_name.trim(),
      bio: nextBio ?? user.user_metadata?.bio ?? '',
      website: nextWebsite ?? user.user_metadata?.website ?? '',
    },
  });

  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

  revalidatePath('/account');
  revalidatePath(`/profile/${user.id}`);
  return NextResponse.json({ ok: true });
}
