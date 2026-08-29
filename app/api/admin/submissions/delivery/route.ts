import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

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

  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
  const confirmed = body.confirmed === true;
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('submissions')
    .update({ delivery_confirmed_at: confirmed ? new Date().toISOString() : null })
    .eq('id', submissionId);

  if (error) {
    if (/delivery_confirmed_at/i.test(error.message ?? '')) {
      return NextResponse.json(
        { error: 'Run the Disco delivery SQL in the dashboard first.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/admin');
  return NextResponse.json({ success: true });
}
