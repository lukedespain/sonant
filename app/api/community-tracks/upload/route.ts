import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { setTrackPublic } from '@/lib/track-privacy';
import {
  COMMUNITY_BUCKET,
  MAX_AUDIO_BYTES,
  communityPrefix,
  tooLargeMessage,
} from '@/lib/audio-upload';

/**
 * Step two of a playlist upload. The browser has already sent the audio to the
 * signed URL from /api/community-tracks/upload-url, so this confirms it landed
 * and records the track.
 */
export async function POST(req: Request) {
  // A tab opened before this shipped still posts the file itself, which Netlify
  // rejects near 4.5 MB. Say so instead of letting it fail without explanation.
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Sonant was updated. Please refresh the page and upload again.' },
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

  const briefId = typeof body.briefId === 'string' ? body.briefId : null;
  const storagePath = typeof body.storagePath === 'string' ? body.storagePath : '';
  const trackName = typeof body.trackName === 'string' ? body.trackName.trim() : '';
  const isPublic = body.isPublic !== false;

  if (!briefId || !storagePath) {
    return NextResponse.json({ error: 'Missing upload details.' }, { status: 400 });
  }

  // The bucket is public, so anyone with the anon key can list a brief's folder
  // and find an object whose uploader never got as far as confirming it. The
  // uploader's id is baked into the key by /upload-url, so requiring it here is
  // what stops a bystander from recording someone else's audio as their own.
  const prefix = communityPrefix(briefId, user.id);
  const objectName = storagePath.startsWith(`${prefix}/`)
    ? storagePath.slice(prefix.length + 1)
    : '';
  if (!objectName || objectName.includes('/') || objectName.includes('..')) {
    return NextResponse.json({ error: 'Unexpected upload location.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Retries and double clicks land here twice with the same key.
  const { data: existing } = await admin
    .from('community_tracks')
    .select('id')
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (existing) return NextResponse.json({ success: true });

  // Scoped to this object rather than listing the folder: a brief's playlist
  // grows without limit, and list() pages alphabetically, so a folder-wide
  // lookup would stop finding new uploads once the brief got popular.
  const { data: listed } = await admin.storage
    .from(COMMUNITY_BUCKET)
    .list(prefix, { limit: 1, search: objectName });
  const object = listed?.find((entry) => entry.name === objectName);

  if (!object) {
    return NextResponse.json(
      { error: 'We never received the audio. Please try the upload again.', uploadGone: true },
      { status: 400 }
    );
  }

  const size = (object.metadata as { size?: number } | null)?.size ?? 0;
  if (size <= 0 || size > MAX_AUDIO_BYTES) {
    await admin.storage.from(COMMUNITY_BUCKET).remove([storagePath]);
    return NextResponse.json(
      {
        error: size > 0 ? tooLargeMessage(size, 'MP3') : 'That file arrived empty.',
        uploadGone: true,
      },
      { status: 400 }
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(COMMUNITY_BUCKET).getPublicUrl(storagePath);

  const { data: inserted, error: dbError } = await admin
    .from('community_tracks')
    .insert({
      brief_id: briefId,
      user_id: user.id,
      file_url: publicUrl,
      file_name: trackName || objectName,
      storage_path: storagePath,
    })
    .select('id')
    .single();

  if (dbError || !inserted) {
    // Once storage_path is unique, a concurrent confirm for the same object
    // lands here. That request owns the row and the audio, so leave both be.
    if (dbError?.code === '23505') return NextResponse.json({ success: true });
    await admin.storage.from(COMMUNITY_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: dbError?.message ?? 'Could not save track', uploadGone: true },
      { status: 500 }
    );
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
