import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { sendSubmissionReceivedEmail } from '@/lib/email';
import { isSiteAdmin } from '@/lib/admin';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function isAllowedSubmitFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const mp3 = name.endsWith('.mp3') || type === 'audio/mpeg' || type === 'audio/mp3';
  const wav = name.endsWith('.wav') || type === 'audio/wav' || type === 'audio/wave' || type === 'audio/x-wav';
  return mp3 || wav;
}

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
  if (!isAllowedSubmitFile(file)) {
    return NextResponse.json({ error: 'Submissions need to be MP3 or WAV.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const skipCredits = isSiteAdmin(user);

  if (!skipCredits) {
    const { data: profile } = await admin
      .from('profiles')
      .select('submission_credits')
      .eq('id', user.id)
      .single();
    const credits = (profile as { submission_credits?: number } | null)?.submission_credits ?? 0;
    if (credits < 1) {
      return NextResponse.json({ error: 'You need a submission credit.' }, { status: 402 });
    }
  }

  const { data: brief } = await admin
    .from('briefs')
    .select('id, generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });

  const { data: submission, error: dbError } = await admin
    .from('submissions')
    .insert({
      user_id: user.id,
      brief_id: briefId,
      status: 'received',
    })
    .select('id')
    .single();

  if (dbError || !submission) {
    return NextResponse.json({ error: dbError?.message ?? 'Could not record submission' }, { status: 500 });
  }

  const ext = file.name.toLowerCase().endsWith('.wav') ? 'wav' : 'mp3';
  const safeName = (trackName ?? file.name).replace(/[^\w\s.-]+/g, '').trim() || `track.${ext}`;
  const storagePath = `${submission.id}/${safeName}.${ext}`.replace(/\.(mp3|wav)\.(mp3|wav)$/i, '.$2');
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('competition-tracks')
    .upload(storagePath, bytes, { contentType: file.type || (ext === 'wav' ? 'audio/wav' : 'audio/mpeg'), upsert: false });

  if (uploadError) {
    await admin.from('submissions').delete().eq('id', submission.id);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  if (!skipCredits) {
    const { error: creditError } = await admin.rpc('increment_credits', {
      p_user_id: user.id,
      p_submission_delta: -1,
      p_session_delta: 0,
    });
    if (creditError) {
      console.error('Could not decrement submission credit', creditError);
    }
  }

  if (user.email) {
    const projectName =
      (brief.generated_content as { codename?: string })?.codename ?? 'your brief';
    await sendSubmissionReceivedEmail({ to: user.email, projectName });
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/submissions');
  revalidatePath('/admin');
  return NextResponse.json({ success: true });
}
