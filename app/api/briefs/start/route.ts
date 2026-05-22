// app/api/briefs/start/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const input = await req.json();

  const { data: job, error } = await supabase
    .from('brief_jobs')
    .insert({ user_id: user.id, status: 'pending', input })
    .select('id')
    .single();

  if (error || !job) {
    console.error('Job insert error:', error);
    return NextResponse.json({ error: 'Could not start generation.' }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  // Fire the background function. Do NOT await — let it run detached.
  fetch(`${origin}/.netlify/functions/generate-brief-background`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: job.id }),
  }).catch((e) => console.error('Background trigger failed:', e));

  return NextResponse.json({ jobId: job.id });
}