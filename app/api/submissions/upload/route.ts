import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { sendSubmissionReceivedEmail } from '@/lib/email';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

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
    return NextResponse.json({ error: 'File too large (max 100 MB)' }, { status: 400 });
  }
  if (!file.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'Must be an audio file' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify brief exists and is a Sonant brief
  const { data: brief } = await admin
    .from('briefs')
    .select('id, user_id, generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  if (brief.user_id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Only Sonant briefs accept track submissions' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'mp3';
  const storagePath = `${briefId}/${user.id}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('competition-tracks')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const displayName = trackName ?? file.name;

  const { error: dbError } = await admin
    .from('submissions')
    .insert({
      user_id: user.id,
      brief_id: briefId,
      status: 'received',
      file_name: displayName,
      storage_path: storagePath,
    });

  if (dbError) {
    await admin.storage.from('competition-tracks').remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (user.email) {
    const projectName =
      (brief.generated_content as { codename?: string })?.codename ?? 'your brief';
    await sendSubmissionReceivedEmail({ to: user.email, projectName });
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/library');
  return NextResponse.json({ success: true });
}
