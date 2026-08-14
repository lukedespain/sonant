import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_USER_ID, isSiteAdmin } from '@/lib/admin';
import { generateClientBrief } from '@/app/briefs/generateClientBrief';
import { generateImageForBrief } from '@/app/briefs/generateImage';
import type { Brief as GeneratorBrief } from '@/app/briefs/generate';
import { revalidatePath } from 'next/cache';

export const maxDuration = 60;

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function toBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString('base64');
}

async function extractDocxText(bytes: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return result.value?.trim() ?? '';
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const formData = await req.formData();
  const sourceText = String(formData.get('sourceText') ?? '');
  const clientName = String(formData.get('clientName') ?? '');
  const projectTitle = String(formData.get('projectTitle') ?? formData.get('brandName') ?? '');
  const dueDate = String(formData.get('dueDate') ?? '');
  const winFee = String(formData.get('winFee') ?? '');
  const demoFee = String(formData.get('demoFee') ?? '');
  const uploads = formData.getAll('files').filter((item): item is File => item instanceof File && item.size > 0);

  const files: {
    name: string;
    mediaType: string;
    base64: string;
    kind: 'image' | 'pdf' | 'text';
    text?: string;
  }[] = [];

  for (const file of uploads) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${file.name} is too large (max 15 MB).` }, { status: 400 });
    }
    const type = file.type || '';
    const name = file.name.toLowerCase();
    const bytes = await file.arrayBuffer();

    if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(name)) {
      const mediaType = type.startsWith('image/') ? type : 'image/jpeg';
      files.push({ name: file.name, mediaType, base64: toBase64(bytes), kind: 'image' });
      continue;
    }
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      files.push({ name: file.name, mediaType: 'application/pdf', base64: toBase64(bytes), kind: 'pdf' });
      continue;
    }
    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const text = await extractDocxText(bytes);
      if (!text) {
        return NextResponse.json({ error: `Could not read ${file.name}. Try a PDF.` }, { status: 400 });
      }
      files.push({ name: file.name, mediaType: 'text/plain', base64: '', kind: 'text', text });
      continue;
    }
    if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
      files.push({
        name: file.name,
        mediaType: 'text/plain',
        base64: '',
        kind: 'text',
        text: new TextDecoder().decode(bytes),
      });
      continue;
    }
    return NextResponse.json({
      error: `${file.name} is not a supported file. Use a photo, PDF, Word document, or text.`,
    }, { status: 400 });
  }

  const result = await generateClientBrief({
    sourceText,
    clientName,
    projectTitle,
    dueDate,
    winFee,
    demoFee,
    files,
  });

  if (result.error || !result.brief) {
    return NextResponse.json({ error: result.error ?? 'Could not generate brief.' }, { status: 500 });
  }

  const admin = createAdminClient();
  const brief = result.brief;
  const { data: saved, error } = await admin
    .from('briefs')
    .insert({
      user_id: ADMIN_USER_ID,
      mode: brief.mode,
      target: brief.classification || 'Client',
      genres: result.genres ?? [],
      moods: result.moods ?? [],
      generated_content: brief,
      status: 'saved',
      brief_type: 'client',
    })
    .select('id')
    .single();

  if (error || !saved) {
    console.error('Save client brief error:', error);
    return NextResponse.json({ error: 'Generated, but could not save the brief.' }, { status: 500 });
  }

  const imageUrl = await generateImageForBrief(brief as unknown as GeneratorBrief, saved.id, admin);
  if (imageUrl) {
    brief.imageUrl = imageUrl;
    await admin.from('briefs').update({ generated_content: brief }).eq('id', saved.id);
  }

  revalidatePath('/browse');
  revalidatePath(`/browse/${saved.id}`);
  revalidatePath('/admin');

  return NextResponse.json({ success: true, briefId: saved.id });
}
