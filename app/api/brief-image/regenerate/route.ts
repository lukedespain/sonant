import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateImageForBrief } from '@/app/briefs/generateImage';
import type { Brief } from '@/app/briefs/generate';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { briefId } = await req.json() as { briefId: string };
  if (!briefId) return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });

  const admin = createAdminClient();

  const { data: briefRow, error } = await admin
    .from('briefs')
    .select('generated_content')
    .eq('id', briefId)
    .single();

  if (error || !briefRow) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const brief = briefRow.generated_content as Brief;
  const imageUrl = await generateImageForBrief(brief, briefId, admin);

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }

  const { error: updateErr } = await admin
    .from('briefs')
    .update({ generated_content: { ...brief, imageUrl } })
    .eq('id', briefId);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 });
  }

  return NextResponse.json({ imageUrl });
}
