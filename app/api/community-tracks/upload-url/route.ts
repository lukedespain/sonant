import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  COMMUNITY_BUCKET,
  MAX_AUDIO_BYTES,
  communityStoragePath,
  contentTypeFor,
  isMp3,
  tooLargeMessage,
} from '@/lib/audio-upload';

/**
 * Step one of a playlist upload: validate, then hand back a signed URL the
 * browser uploads to directly. Step two is /api/community-tracks/upload.
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

  if (!briefId || !fileName || fileSize === null) {
    return NextResponse.json({ error: 'Missing file details or briefId' }, { status: 400 });
  }
  if (!isMp3(fileName, contentType)) {
    return NextResponse.json({ error: 'Uploads need to be MP3.' }, { status: 400 });
  }
  if (fileSize <= 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (fileSize > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: tooLargeMessage(fileSize, 'MP3') }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: brief } = await admin
    .from('briefs')
    .select('id, brief_type, generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });

  const content = (brief.generated_content ?? {}) as { kind?: string };
  if (brief.brief_type === 'client' || content.kind === 'client') {
    return NextResponse.json(
      {
        error:
          'Client briefs do not have a playlist. Submit the track to the Sonant team instead.',
      },
      { status: 400 }
    );
  }

  const storagePath = communityStoragePath(briefId, user.id);

  const { data: signed, error } = await admin.storage
    .from(COMMUNITY_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !signed) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not start the upload.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    storagePath,
    signedUrl: signed.signedUrl,
    contentType: contentTypeFor('mp3'),
  });
}
