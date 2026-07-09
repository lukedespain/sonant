// app/api/briefs/start/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBrief } from '@/app/briefs/generate';
import { attachImageIfAdmin } from '@/app/briefs/generateImage';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const input = await req.json();

  const { data: job, error } = await supabase
    .from('brief_jobs')
    .insert({ user_id: user?.id ?? null, status: 'pending', input })
    .select('id')
    .single();

  if (error || !job) {
    console.error('Job insert error:', error);
    return NextResponse.json({ error: 'Could not start generation.' }, { status: 500 });
  }

  if (process.env.NODE_ENV === 'development') {
    // In local dev the Netlify background function isn't available.
    // Run generation inline so the polling loop finds a result immediately.
    const admin = createAdminClient();
    generateBrief(input).then(async (result) => {
      if (result.error || !result.brief) {
        await admin
          .from('brief_jobs')
          .update({ status: 'error', error_message: result.error ?? 'Unknown error' })
          .eq('id', job.id);
      } else {
        await attachImageIfAdmin(result.brief, job.id, user?.id, admin);
        await admin
          .from('brief_jobs')
          .update({ status: 'done', result: result.brief })
          .eq('id', job.id);
      }
    }).catch(async (err) => {
      console.error('Inline generation error:', err);
      const admin = createAdminClient();
      await admin
        .from('brief_jobs')
        .update({ status: 'error', error_message: 'Generation crashed.' })
        .eq('id', job.id);
    });

    return NextResponse.json({ jobId: job.id });
  }

  // Production: fire the Netlify background function.
  const origin = new URL(req.url).origin;
  const admin = createAdminClient();
  try {
    const bgRes = await Promise.race([
      fetch(`${origin}/.netlify/functions/generate-brief-background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('trigger timeout')), 12000)
      ),
    ]);
    if (!bgRes.ok) {
      console.error('Background function trigger returned', bgRes.status);
      await admin
        .from('brief_jobs')
        .update({ status: 'error', error_message: 'Failed to start generation. Please try again.' })
        .eq('id', job.id);
    }
  } catch (e) {
    console.error('Background trigger failed:', e);
    await admin
      .from('brief_jobs')
      .update({ status: 'error', error_message: 'Failed to start generation. Please try again.' })
      .eq('id', job.id);
  }

  return NextResponse.json({ jobId: job.id });
}
