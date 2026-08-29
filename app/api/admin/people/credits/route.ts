import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { adjustCredits } from '@/lib/credits';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const submissionDelta = typeof body.submissionDelta === 'number' ? body.submissionDelta : 0;
  const sessionDelta = typeof body.sessionDelta === 'number' ? body.sessionDelta : 0;

  if (!userId) return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
  if (!Number.isInteger(submissionDelta) || !Number.isInteger(sessionDelta)) {
    return NextResponse.json({ error: 'Credit changes must be whole numbers.' }, { status: 400 });
  }
  if (Math.abs(submissionDelta) > 20 || Math.abs(sessionDelta) > 20) {
    return NextResponse.json({ error: 'That credit change is too large.' }, { status: 400 });
  }
  if (submissionDelta === 0 && sessionDelta === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  }

  const result = await adjustCredits(createAdminClient(), userId, submissionDelta, sessionDelta);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  revalidatePath(`/profile/${userId}`);
  return NextResponse.json({
    success: true,
    submissionCredits: result.submissionCredits,
    sessionCredits: result.sessionCredits,
  });
}
