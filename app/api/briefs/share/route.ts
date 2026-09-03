import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBriefShareEmail } from '@/lib/email';
import { getOrCreateReferralCode } from '@/lib/referral-codes';
import { siteUrl } from '@/lib/site-url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 10;

function parseEmails(body: { email?: unknown; emails?: unknown }) {
  const raw: string[] = [];
  if (typeof body.email === 'string') raw.push(body.email);
  if (Array.isArray(body.emails)) {
    for (const value of body.emails) {
      if (typeof value === 'string') raw.push(value);
    }
  }
  const unique = [...new Set(
    raw
      .flatMap((value) => value.split(/[,;\n]+/))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  )];
  return unique;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to share a brief.' }, { status: 401 });

  const admin = createAdminClient();
  const code = await getOrCreateReferralCode(admin, user.id, user.user_metadata?.referral_code);
  if (user.user_metadata?.referral_code !== code) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, referral_code: code },
    });
  }
  return NextResponse.json({
    code,
    shareBase: `${siteUrl()}/signup?ref=${encodeURIComponent(code)}`,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to share a brief.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const briefId = typeof body?.briefId === 'string' ? body.briefId : '';
  const emails = parseEmails(body ?? {});

  if (!briefId) {
    return NextResponse.json({ error: 'Brief is missing.' }, { status: 400 });
  }
  if (emails.length === 0) {
    return NextResponse.json({ error: 'Add at least one email address.' }, { status: 400 });
  }
  if (emails.length > MAX_EMAILS) {
    return NextResponse.json({ error: `You can invite ${MAX_EMAILS} people at a time.` }, { status: 400 });
  }
  if (emails.some((email) => !EMAIL_RE.test(email))) {
    return NextResponse.json({ error: 'One of those emails does not look valid.' }, { status: 400 });
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
  const origin = siteUrl();
  const briefPath = `/browse/${briefId}`;
  const code = await getOrCreateReferralCode(admin, user.id, user.user_metadata?.referral_code);
  if (user.user_metadata?.referral_code !== code) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, referral_code: code },
    });
  }
  const signupUrl = `${origin}/signup?ref=${encodeURIComponent(code)}&redirect=${encodeURIComponent(briefPath)}`;

  const failed: string[] = [];
  for (const email of emails) {
    const result = await sendBriefShareEmail({
      to: email,
      briefName,
      senderName,
      briefUrl: `${origin}${briefPath}`,
      signupUrl,
      loginUrl: `${origin}/login?redirect=${encodeURIComponent(briefPath)}`,
    });
    if (result.error) failed.push(email);
  }

  if (failed.length === emails.length) {
    return NextResponse.json({ error: 'Could not send the invites.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    sent: emails.length - failed.length,
    failed,
    code,
    shareUrl: signupUrl,
  });
}
