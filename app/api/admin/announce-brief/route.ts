import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID, isSiteAdmin } from '@/lib/admin';
import { announceNewBrief, briefDisplayName } from '@/lib/brief-announcements';
import { isClientBriefRecord } from '@/lib/disco';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const briefId = typeof body?.briefId === 'string' ? body.briefId : '';
  if (!briefId) return NextResponse.json({ error: 'Missing brief.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: brief, error } = await admin
    .from('briefs')
    .select('id, user_id, brief_type, generated_content')
    .eq('id', briefId)
    .single();

  if (error || !brief) {
    return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
  }

  const content = (brief.generated_content ?? {}) as {
    kind?: string;
    projectTitle?: string;
    project?: string;
    client?: string;
    codename?: string;
  };
  const isClient = isClientBriefRecord(brief);
  const isFeatured = brief.user_id === ADMIN_USER_ID && !isClient;
  if (!isClient && !isFeatured) {
    return NextResponse.json({ error: 'Only paid and Sonant briefs can be announced.' }, { status: 400 });
  }

  try {
    const result = await announceNewBrief({
      admin,
      kind: isClient ? 'client' : 'featured',
      briefId,
      briefName: briefDisplayName(content),
      force: true,
    });
    return NextResponse.json({ success: true, sent: result.sent });
  } catch (announceError) {
    console.error('Announce brief failed:', announceError);
    return NextResponse.json({ error: 'Could not send the announcement.' }, { status: 500 });
  }
}
