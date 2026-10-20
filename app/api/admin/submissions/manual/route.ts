import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { isClientBriefRecord } from '@/lib/disco';
import {
  MAX_AUDIO_BYTES,
  SUBMISSION_BUCKET,
  contentTypeFor,
  detectAudioKind,
  tooLargeMessage,
  toStorageStem,
} from '@/lib/audio-upload';

// Records a track a composer sent outside Sonant (email, WhatsApp) as a normal
// submission, so it can go through Send / Accepted and the catalog sign-on.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    composerEmail?: string;
    briefId?: string;
    trackName?: string;
    fileName?: string;
    fileSize?: number;
    contentType?: string;
  } | null;

  const email = body?.composerEmail?.trim().toLowerCase() ?? '';
  const briefId = body?.briefId ?? '';
  const trackName = body?.trackName?.trim() ?? '';
  if (!email || !briefId) return NextResponse.json({ error: 'Add the composer email and pick a brief.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (!profile) {
    return NextResponse.json(
      { error: 'No Sonant account uses that email. Ask the composer to sign up first, then try again.' },
      { status: 404 },
    );
  }

  const { data: brief } = await admin.from('briefs').select('id, brief_type, generated_content').eq('id', briefId).maybeSingle();
  if (!brief) return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
  if (isClientBriefRecord(brief)) {
    return NextResponse.json({ error: 'Client briefs are delivered through Disco.' }, { status: 400 });
  }

  let upload: { signedUrl: string; contentType: string } | null = null;
  const submissionId = crypto.randomUUID();

  if (body?.fileName) {
    const kind = detectAudioKind(body.fileName, body.contentType ?? null);
    if (!kind) return NextResponse.json({ error: 'The file needs to be MP3 or WAV.' }, { status: 400 });
    const size = body.fileSize ?? 0;
    if (size <= 0) return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
    if (size > MAX_AUDIO_BYTES) return NextResponse.json({ error: tooLargeMessage(size, 'MP3 or WAV') }, { status: 400 });

    const path = `${submissionId}/${toStorageStem(trackName || body.fileName)}.${kind}`;
    const { data: signed, error } = await admin.storage.from(SUBMISSION_BUCKET).createSignedUploadUrl(path);
    if (error || !signed) return NextResponse.json({ error: 'Could not start the upload.' }, { status: 500 });
    upload = { signedUrl: signed.signedUrl, contentType: contentTypeFor(kind) };
  }

  const { error: insertError } = await admin.from('submissions').insert({
    id: submissionId,
    user_id: profile.id,
    brief_id: briefId,
    status: 'received',
    delivery: 'upload',
  });
  if (insertError) {
    console.error('Manual submission insert failed:', insertError);
    return NextResponse.json({ error: 'Could not create the submission.' }, { status: 500 });
  }

  revalidatePath('/admin');
  return NextResponse.json({ ok: true, submissionId, upload });
}
