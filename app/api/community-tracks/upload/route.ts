import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const briefId = formData.get('briefId') as string | null;
  const trackName = (formData.get('trackName') as string | null)?.trim() || null;

  if (!file || !briefId) {
    return NextResponse.json({ error: 'Missing file or briefId' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 });
  }
  if (!file.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the brief exists
  const { data: brief } = await admin
    .from('briefs')
    .select('id')
    .eq('id', briefId)
    .single();

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const ext = file.name.split('.').pop() ?? 'mp3';
  const storagePath = `${briefId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('community-tracks')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('community-tracks')
    .getPublicUrl(storagePath);

  const { error: dbError } = await admin
    .from('community_tracks')
    .insert({
      brief_id: briefId,
      user_id: user.id,
      file_url: publicUrl,
      file_name: trackName ?? file.name,
      storage_path: storagePath,
    });

  if (dbError) {
    await admin.storage.from('community-tracks').remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  revalidatePath(`/browse/${briefId}`);
  return NextResponse.json({ success: true });
}
