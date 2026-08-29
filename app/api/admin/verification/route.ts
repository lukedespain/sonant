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

  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  let override: boolean | null = null;
  if (body.override === true) override = true;
  else if (body.override === false) override = false;
  else if (body.override === null || body.override === 'auto') override = null;
  else {
    return NextResponse.json({ error: 'override must be true, false, or null.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ verified_override: override })
    .eq('id', userId);

  if (error) {
    if (/verified_override/i.test(error.message ?? '')) {
      return NextResponse.json(
        { error: 'Run the verification SQL in the dashboard first.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/profile/${userId}`);
  revalidatePath('/browse');
  return NextResponse.json({ success: true, override });
}
