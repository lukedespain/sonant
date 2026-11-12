import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { normalizeTagList, tagProblem, withTrackTags } from '@/lib/track-tags';

/** Sets the genres and moods an accepted track nails. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { submissionId?: string; genres?: unknown; moods?: unknown } | null;
  const submissionId = body?.submissionId ?? '';
  const tags = { genres: normalizeTagList(body?.genres), moods: normalizeTagList(body?.moods) };
  const problem = tagProblem(tags);
  if (!submissionId) return NextResponse.json({ error: 'Missing track.' }, { status: 400 });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from('submissions')
    .select('user_id, status')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Track not found.' }, { status: 404 });
  if (submission.status !== 'accepted') {
    return NextResponse.json({ error: 'Only accepted tracks are tagged.' }, { status: 400 });
  }

  const { data } = await admin.auth.admin.getUserById(submission.user_id);
  if (!data?.user) return NextResponse.json({ error: 'Composer not found.' }, { status: 404 });

  const { error } = await admin.auth.admin.updateUserById(submission.user_id, {
    app_metadata: withTrackTags(data.user.app_metadata, submissionId, tags),
  });
  if (error) return NextResponse.json({ error: 'Could not save the tags.' }, { status: 500 });

  revalidatePath('/admin');
  return NextResponse.json({ ok: true, tags });
}
