import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { sendSubmissionReceivedEmail } from '@/lib/email';
import { isSiteAdmin } from '@/lib/admin';
import { isClientBriefRecord } from '@/lib/disco';
import { refundSubmissionCredit, spendSubmissionCredit } from '@/lib/credits';
import { MAX_AUDIO_BYTES, SUBMISSION_BUCKET, tooLargeMessage } from '@/lib/audio-upload';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Step two of a submission. The browser has already uploaded the audio to the
 * signed URL from /api/submissions/upload-url, so this only confirms the file
 * arrived, records the row, and spends the credit.
 */
export async function POST(req: Request) {
  // A tab opened before this shipped still posts the file itself, which Netlify
  // rejects near 4.5 MB. Say so instead of letting it fail without explanation.
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Sonant was updated. Please refresh the page and submit again.' },
      { status: 400 }
    );
  }

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

  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
  const briefId = typeof body.briefId === 'string' ? body.briefId : null;
  const storagePath = typeof body.storagePath === 'string' ? body.storagePath : '';

  if (!UUID.test(submissionId) || !briefId) {
    return NextResponse.json({ error: 'Missing submission details.' }, { status: 400 });
  }
  // The signed URL only covers this prefix, so anything else is not ours.
  if (!storagePath.startsWith(`${submissionId}/`) || storagePath.includes('..')) {
    return NextResponse.json({ error: 'Unexpected upload location.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Retries and double clicks land here twice; the first call already charged.
  const { data: existing } = await admin
    .from('submissions')
    .select('id')
    .eq('id', submissionId)
    .maybeSingle();
  if (existing) return NextResponse.json({ success: true });

  const objectName = storagePath.slice(submissionId.length + 1);
  const { data: listed } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .list(submissionId, { limit: 100 });
  const object = listed?.find((entry) => entry.name === objectName);

  if (!object) {
    return NextResponse.json(
      { error: 'We never received the audio. Please try the upload again.', uploadGone: true },
      { status: 400 }
    );
  }

  const size = (object.metadata as { size?: number } | null)?.size ?? 0;
  if (size <= 0 || size > MAX_AUDIO_BYTES) {
    await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
    return NextResponse.json(
      {
        error: size > 0 ? tooLargeMessage(size, 'MP3 or WAV') : 'That file arrived empty.',
        uploadGone: true,
      },
      { status: 400 }
    );
  }

  const { data: brief } = await admin
    .from('briefs')
    .select('id, brief_type, generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) {
    await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: 'Brief not found', uploadGone: true }, { status: 404 });
  }
  if (isClientBriefRecord(brief)) {
    await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: 'Client briefs are delivered through Disco, not uploaded here.', uploadGone: true },
      { status: 400 }
    );
  }

  // Spend the credit before recording the submission, and only in a way that
  // can fail. Reading the balance and then debiting it separately let two
  // confirms both spend the last credit, and a debit that only logged its
  // error handed out free submissions.
  const skipCredits = isSiteAdmin(user);
  if (!skipCredits) {
    const spend = await spendSubmissionCredit(admin, user.id);
    if (!spend.ok) {
      await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
      return spend.reason === 'insufficient'
        ? NextResponse.json(
            { error: 'You need a submission credit.', uploadGone: true },
            { status: 402 }
          )
        : NextResponse.json({ error: spend.message, uploadGone: true }, { status: 500 });
    }
  }

  const { data: submission, error: dbError } = await admin
    .from('submissions')
    .insert({
      id: submissionId,
      user_id: user.id,
      brief_id: briefId,
      status: 'received',
    })
    .select('id')
    .single();

  if (dbError || !submission) {
    // Nothing was recorded under this credit, so give it back either way.
    if (!skipCredits) await refundSubmissionCredit(admin, user.id);
    // A duplicate means a concurrent request won the race and owns the audio.
    if (dbError?.code === '23505') return NextResponse.json({ success: true });
    await admin.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: dbError?.message ?? 'Could not record submission', uploadGone: true },
      { status: 500 }
    );
  }

  if (user.email) {
    const to = user.email;
    const projectName =
      (brief.generated_content as { codename?: string })?.codename ?? 'your brief';
    const sendReceipt = () => sendSubmissionReceivedEmail({ to, projectName });
    try {
      // The credit is already spent by this point, so a slow email provider
      // must not be able to time the response out: the composer would see a
      // failure and submit again, paying twice for one track.
      after(sendReceipt);
    } catch (afterUnavailable) {
      // No waitUntil here. Still better to let the response go than to wait.
      console.warn('after() unavailable; sending receipt inline', afterUnavailable);
      void sendReceipt();
    }
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/submissions');
  revalidatePath('/admin');
  return NextResponse.json({ success: true });
}
