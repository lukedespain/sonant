// app/api/briefs/start/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBrief, type Brief } from '@/app/briefs/generate';
import { NextResponse } from 'next/server';

async function generateBriefImage(brief: Brief): Promise<string | undefined> {
  const falApiKey = process.env.FAL_API_KEY;
  if (!falApiKey) return undefined;

  const modeDescriptor =
    brief.mode === 'film' ? 'cinematic film still' :
    brief.mode === 'games' ? 'cinematic game key art' :
    'brand campaign photograph';

  const sceneContext = brief.story.split(/(?<=\.)\s+/).slice(0, 2).join(' ').trim();

  const prompt = `${modeDescriptor}, ${sceneContext}, ${brief.emotionalArc} mood, professional photography, dramatic natural lighting, no text overlays, no logos, high production value, editorial style, shot like a major brand or film production`;

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
      }),
    });
    if (!response.ok) return undefined;
    const data = await response.json() as { images?: { url: string }[] };
    return data?.images?.[0]?.url;
  } catch {
    return undefined;
  }
}

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
        const imageUrl = await generateBriefImage(result.brief);
        const briefWithImage = imageUrl
          ? { ...result.brief, imageUrl }
          : result.brief;
        await admin
          .from('brief_jobs')
          .update({ status: 'done', result: briefWithImage })
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
  // Background functions return 202 immediately, so we await with a short
  // timeout. If it fails to trigger we surface the error right away instead
  // of making the client poll for 7.5 minutes before timing out.
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
