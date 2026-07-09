import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const briefId = formData.get('briefId') as string | null;

  if (!file || !briefId) {
    return NextResponse.json({ error: 'Missing file or briefId' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const admin = createAdminClient();

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${briefId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('brief-images')
    .upload(storagePath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage
    .from('brief-images')
    .getPublicUrl(storagePath);

  // Merge imageUrl into the existing generated_content JSON
  const { data: brief } = await admin
    .from('briefs')
    .select('generated_content')
    .eq('id', briefId)
    .single();

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from('briefs')
    .update({ generated_content: { ...(brief.generated_content as object), imageUrl: publicUrl } })
    .eq('id', briefId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/browse');
  return NextResponse.json({ success: true, imageUrl: publicUrl });
}
