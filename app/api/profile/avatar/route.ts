import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storagePath = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(storagePath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(storagePath);

  // Append cache-buster so the browser always fetches the latest
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  revalidatePath('/account');
  revalidatePath('/community');
  return NextResponse.json({ avatar_url: avatarUrl });
}
