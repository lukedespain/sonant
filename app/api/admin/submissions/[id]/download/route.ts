import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { SUBMISSION_BUCKET } from '@/lib/audio-upload';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing submission.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: objects } = await admin.storage.from(SUBMISSION_BUCKET).list(id, { limit: 20 });
  const file = (objects ?? []).find((entry) => entry.name && !entry.name.endsWith('/'));
  if (!file) {
    return NextResponse.json({ error: 'No audio on this submission.' }, { status: 404 });
  }

  const path = `${id}/${file.name}`;
  const { data, error } = await admin.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUrl(path, 60, { download: file.name });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not create a download link.' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
