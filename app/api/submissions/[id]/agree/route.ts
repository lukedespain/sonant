import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { catalogPartnerById } from '@/lib/partners';
import { sendHandoffEmail } from '@/lib/email';
import {
  normalizeRights,
  readHandoffs,
  readRights,
  validateRights,
  validateStemsUrl,
} from '@/lib/handoff';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { stemsUrl?: string; rights?: unknown; agreed?: boolean } | null;
  if (!body?.agreed) return NextResponse.json({ error: 'Agree to the terms to continue.' }, { status: 400 });

  const stemsUrl = (body.stemsUrl ?? '').trim();
  const stemsProblem = validateStemsUrl(stemsUrl);
  if (stemsProblem) return NextResponse.json({ error: stemsProblem }, { status: 400 });

  const rights = normalizeRights(readRights({ rights: body.rights }));
  const rightsProblem = validateRights(rights);
  if (rightsProblem) return NextResponse.json({ error: rightsProblem }, { status: 400 });

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from('submissions')
    .select('id, user_id, brief_id, status, file_name')
    .eq('id', id)
    .maybeSingle();
  if (!submission || submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }
  if (submission.status !== 'accepted') {
    return NextResponse.json({ error: 'This track has not been accepted yet.' }, { status: 400 });
  }

  const { data: fresh } = await admin.auth.admin.getUserById(user.id);
  const handoffs = readHandoffs(fresh?.user?.app_metadata);
  const offer = handoffs[id];
  if (!offer) return NextResponse.json({ error: 'There is no offer on this track.' }, { status: 400 });
  if (offer.agreedAt) return NextResponse.json({ ok: true, agreedAt: offer.agreedAt });

  const agreedAt = new Date().toISOString();
  handoffs[id] = { ...offer, agreedAt, stemsUrl };

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...fresh?.user?.user_metadata, rights },
    app_metadata: { ...fresh?.user?.app_metadata, handoffs },
  });
  if (error) return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 });

  const [{ data: brief }, { data: profile }] = await Promise.all([
    admin.from('briefs').select('generated_content').eq('id', submission.brief_id).maybeSingle(),
    admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);
  const content = brief?.generated_content as { codename?: string; projectTitle?: string } | null;

  await sendHandoffEmail({
    composerName: (profile as { full_name?: string } | null)?.full_name ?? '',
    composerEmail: user.email ?? '',
    projectName: content?.projectTitle || content?.codename || 'Untitled',
    trackName: (submission as { file_name?: string | null }).file_name ?? null,
    catalogName: catalogPartnerById(offer.catalogId)?.name ?? 'Sonant',
    stemsUrl,
    rights,
  });

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return NextResponse.json({ ok: true, agreedAt });
}
