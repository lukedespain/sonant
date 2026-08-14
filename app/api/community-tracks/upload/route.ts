import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { setTrackPublic } from '@/lib/track-privacy';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function isMp3(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const briefId = formData.get('briefId') as string | null;
  const trackName = (formData.get('trackName') as string | null)?.trim() || null;
  const isPublic = formData.get('isPublic') !== 'false';

  if (!file || !briefId) {
    return NextResponse.json({ error: 'Missing file or briefId' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 });
  }
  if (!isMp3(file)) {
    return NextResponse.json({ error: 'Uploads need to be MP3.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: brief } = await admin
    .from('briefs')
    .select('id, brief_type, generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const content = (brief.generated_content ?? {}) as { kind?: string };
  const isClientBrief = brief.brief_type === 'client' || content.kind === 'client';
  if (isClientBrief) {
    return NextResponse.json(
      { error: 'Client briefs do not have a playlist. Submit the track to the Sonant team instead.' },
      { status: 400 }
    );
  }

  const storagePath = `${briefId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('community-tracks')
    .upload(storagePath, bytes, { contentType: 'audio/mpeg', upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('community-tracks')
    .getPublicUrl(storagePath);

  const { data: inserted, error: dbError } = await admin
    .from('community_tracks')
    .insert({
      brief_id: briefId,
      user_id: user.id,
      file_url: publicUrl,
      file_name: trackName ?? file.name,
      storage_path: storagePath,
    })
    .select('id')
    .single();

  if (dbError || !inserted) {
    await admin.storage.from('community-tracks').remove([storagePath]);
    return NextResponse.json({ error: dbError?.message ?? 'Could not save track' }, { status: 500 });
  }

  if (!isPublic) {
    try {
      await setTrackPublic(inserted.id, false);
    } catch {
      // Track is saved; visibility can be toggled later.
    }
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath(`/profile/${user.id}`);
  return NextResponse.json({ success: true });
}
