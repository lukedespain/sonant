// netlify/functions/generate-brief-background.mts
import { createClient } from '@supabase/supabase-js';
import { generateBrief } from '../../app/briefs/generate';

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
      await admin
        .from('brief_jobs')
        .update({ status: 'done', result: result.brief })
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

export const config = { type: 'experimental-background' };
