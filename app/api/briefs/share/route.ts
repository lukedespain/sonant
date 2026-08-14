import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBriefShareEmail } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to share a brief.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const briefId = typeof body?.briefId === 'string' ? body.briefId : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!briefId || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Add a valid email address.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: briefRow } = await admin
    .from('briefs')
    .select('id, brief_type, generated_content, user_id')
    .eq('id', briefId)
    .single();

  if (!briefRow) {
    return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
  }

  const content = (briefRow.generated_content ?? {}) as {
    kind?: string;
    codename?: string;
    projectTitle?: string;
  };
  const isClient = briefRow.brief_type === 'client' || content.kind === 'client';
  if (isClient) {
    return NextResponse.json({ error: 'Client briefs cannot be shared.' }, { status: 403 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const senderName =
    (profile as { full_name?: string } | null)?.full_name?.trim()
    || (user.user_metadata?.full_name as string | undefined)?.trim()
    || 'A composer on Sonant';
  const briefName = content.projectTitle || content.codename || 'Untitled brief';
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonant.ac';
  const briefPath = `/browse/${briefId}`;

  const result = await sendBriefShareEmail({
    to: email,
    briefName,
    senderName,
    briefUrl: `${origin}${briefPath}`,
    signupUrl: `${origin}/signup?ref=${encodeURIComponent(user.id)}&redirect=${encodeURIComponent(briefPath)}`,
    loginUrl: `${origin}/login?redirect=${encodeURIComponent(briefPath)}`,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
