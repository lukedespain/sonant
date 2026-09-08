import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { sendSubmissionReceivedEmail } from '@/lib/email';
import { isSiteAdmin } from '@/lib/admin';
import { isClientBriefRecord } from '@/lib/disco';
import { refundSubmissionCredit, spendSubmissionCredit } from '@/lib/credits';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import {
  COMMUNITY_BUCKET,
  MAX_AUDIO_BYTES,
  SUBMISSION_BUCKET,
  contentTypeFor,
  detectAudioKind,
  tooLargeMessage,
  toStorageStem,
} from '@/lib/audio-upload';
import { classifyBrief } from '@/lib/brief-kind';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pathFromPublicUrl(fileUrl: string): string | null {
  const marker = `/object/public/${COMMUNITY_BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(fileUrl.slice(idx + marker.length).split('?')[0]);
}

/**
 * Submit an already-uploaded playlist track to the catalog. Copies the audio
 * into the submissions bucket so review keeps working the same way, then
 * spends one credit.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const communityTrackId = typeof body.communityTrackId === 'string' ? body.communityTrackId : '';
  if (!UUID.test(communityTrackId)) {
    return NextResponse.json({ error: 'Missing track.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const skipCredits = isSiteAdmin(user);

  if (!skipCredits) {
    await ensureMonthlySubmissionCredit(admin, user);
  }

  const { data: track } = await admin
    .from('community_tracks')
    .select('id, user_id, brief_id, file_name, file_url, storage_path')
    .eq('id', communityTrackId)
    .maybeSingle();

  if (!track || track.user_id !== user.id) {
    return NextResponse.json({ error: 'Track not found.' }, { status: 404 });
  }

  const { data: brief } = await admin
    .from('briefs')
    .select('id, user_id, brief_type, generated_content')
    .eq('id', track.brief_id)
    .single();

  if (!brief) return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
  if (isClientBriefRecord(brief) || classifyBrief(brief) !== 'catalog') {
    return NextResponse.json(
      { error: 'Only uploads on catalog briefs can be submitted this way.' },
      { status: 400 }
    );
  }

  const fileName = (track.file_name as string | null) || 'track.mp3';
  const kind = detectAudioKind(fileName) ?? 'mp3';
  const sourcePath =
    (typeof track.storage_path === 'string' && track.storage_path) ||
    pathFromPublicUrl((track.file_url as string) || '');

  if (!sourcePath) {
    return NextResponse.json({ error: 'Could not find that audio file.' }, { status: 400 });
  }

  const { data: audio, error: downloadError } = await admin.storage
    .from(COMMUNITY_BUCKET)
    .download(sourcePath);

  if (downloadError || !audio) {
    return NextResponse.json(
      { error: 'Could not read that upload. Try submitting from the brief page.' },
      { status: 400 }
    );
  }

  if (audio.size <= 0 || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: audio.size > 0 ? tooLargeMessage(audio.size, 'MP3 or WAV') : 'That file arrived empty.' },
      { status: 400 }
    );
  }

  const submissionId = crypto.randomUUID();
  const storagePath = `${submissionId}/${toStorageStem(fileName)}.${kind}`;
  const { error: uploadError } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .upload(storagePath, audio, { contentType: contentTypeFor(kind), upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message ?? 'Could not copy the track.' }, { status: 500 });
  }

  if (!skipCredits) {
    const spend = await spendSubmissionCredit(admin, user.id);
    if (!spend.ok) {
      await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
      return spend.reason === 'insufficient'
        ? NextResponse.json({ error: 'You need a submission credit.' }, { status: 402 })
        : NextResponse.json({ error: spend.message }, { status: 500 });
    }
  }

  const fullInsert = {
    id: submissionId,
    user_id: user.id,
    brief_id: track.brief_id as string,
    status: 'received',
    file_name: fileName,
  };
  const { data: submission, error: dbError } = await admin
    .from('submissions')
    .insert(fullInsert)
    .select('id')
    .single();

  if (dbError || !submission) {
    const missingColumn = /file_name/i.test(dbError?.message ?? '');
    if (missingColumn) {
      const fallback = await admin
        .from('submissions')
        .insert({
          id: submissionId,
          user_id: user.id,
          brief_id: track.brief_id as string,
          status: 'received',
        })
        .select('id')
        .single();
      if (fallback.error || !fallback.data) {
        if (!skipCredits) await refundSubmissionCredit(admin, user.id);
        await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
        return NextResponse.json(
          { error: fallback.error?.message ?? 'Could not record submission' },
          { status: 500 }
        );
      }
    } else {
      if (!skipCredits) await refundSubmissionCredit(admin, user.id);
      if (dbError?.code === '23505') return NextResponse.json({ success: true });
      await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: dbError?.message ?? 'Could not record submission' },
        { status: 500 }
      );
    }
  }

  if (user.email) {
    const to = user.email;
    const projectName =
      (brief.generated_content as { codename?: string })?.codename ?? 'your brief';
    const sendReceipt = () => sendSubmissionReceivedEmail({ to, projectName });
    try {
      after(sendReceipt);
    } catch (afterUnavailable) {
      console.warn('after() unavailable; sending receipt inline', afterUnavailable);
      void sendReceipt();
    }
  }

  revalidatePath(`/briefs/${track.brief_id}`);
  revalidatePath('/catalog');
  revalidatePath('/music');
  revalidatePath('/submissions');
  revalidatePath('/admin');
  return NextResponse.json({ success: true });
}
