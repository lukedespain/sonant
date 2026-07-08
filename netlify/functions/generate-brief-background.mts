// netlify/functions/generate-brief-background.mts
import { createClient } from '@supabase/supabase-js';
import { generateBrief, type Brief } from '../../app/briefs/generate';

async function generateBriefImage(brief: Brief): Promise<string | undefined> {
  const falApiKey = process.env.FAL_API_KEY;
  if (!falApiKey) return undefined;

  const modeDescriptor =
    brief.mode === 'film' ? 'cinematic film still' :
    brief.mode === 'games' ? 'cinematic game key art' :
    'brand campaign photograph';

  // Use the first 2 sentences of the scene for the image prompt
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

    if (!response.ok) {
      console.error('fal.ai image gen failed:', response.status, await response.text());
      return undefined;
    }

    const data = await response.json() as { images?: { url: string }[] };
    return data?.images?.[0]?.url;
  } catch (err) {
    console.error('fal.ai image gen error:', err);
    return undefined;
  }
}

export default async (req: Request) => {
  let jobId: string | undefined;
  try {
    const body = await req.json();
    jobId = body.jobId;
    if (!jobId) return new Response('Missing jobId', { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: job, error: jobErr } = await admin
      .from('brief_jobs')
      .select('input')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) {
      console.error('Job not found:', jobId, jobErr);
      return new Response('Job not found', { status: 404 });
    }

    const result = await generateBrief(job.input);

    if (result.error || !result.brief) {
      await admin
        .from('brief_jobs')
        .update({ status: 'error', error_message: result.error ?? 'Unknown error' })
        .eq('id', jobId);
    } else {
      // Attempt image generation — attach if successful, continue without if not
      const imageUrl = await generateBriefImage(result.brief);
      const briefWithImage = imageUrl
        ? { ...result.brief, imageUrl }
        : result.brief;

      await admin
        .from('brief_jobs')
        .update({ status: 'done', result: briefWithImage })
        .eq('id', jobId);
    }
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Background function error:', err);
    if (jobId) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin
        .from('brief_jobs')
        .update({ status: 'error', error_message: 'Generation crashed.' })
        .eq('id', jobId);
    }
    return new Response('Error', { status: 500 });
  }
};
