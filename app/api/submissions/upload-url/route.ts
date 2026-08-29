import { NextResponse } from 'next/server';
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

/**
 * Step one of a submission: validate the file's details and hand back a signed
 * URL the browser uploads to directly. Step two is /api/submissions/upload,
 * which records the row once the audio has landed.
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

  const briefId = typeof body.briefId === 'string' ? body.briefId : null;
  const fileName = typeof body.fileName === 'string' ? body.fileName : null;
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null;
  const contentType = typeof body.contentType === 'string' ? body.contentType : null;
  const trackName = typeof body.trackName === 'string' ? body.trackName.trim() : '';

  if (!briefId || !fileName || fileSize === null) {
    return NextResponse.json({ error: 'Missing file details or briefId' }, { status: 400 });
  }

  const kind = detectAudioKind(fileName, contentType);
  if (!kind) {
    return NextResponse.json({ error: 'Submissions need to be MP3 or WAV.' }, { status: 400 });
  }
  if (fileSize <= 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (fileSize > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: tooLargeMessage(fileSize, 'MP3 or WAV') }, { status: 400 });
  }

  const admin = createAdminClient();

  // Checked again when the submission is recorded; this is just to fail before
  // the composer sits through an upload they cannot spend.
  if (!isSiteAdmin(user)) {
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
    .select('id, brief_type, generated_content')
    .eq('id', briefId)
    .single();
  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  if (isClientBriefRecord(brief)) {
    return NextResponse.json(
      { error: 'Client briefs are delivered through Disco, not uploaded here.' },
      { status: 400 }
    );
  }

  // The id is minted here so the storage key and the eventual row agree, which
  // also makes recording the submission idempotent if the request is retried.
  const submissionId = crypto.randomUUID();
  const storagePath = `${submissionId}/${toStorageStem(trackName || fileName)}.${kind}`;

  const { data: signed, error } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !signed) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not start the upload.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    submissionId,
    storagePath,
    signedUrl: signed.signedUrl,
    contentType: contentTypeFor(kind),
  });
}
