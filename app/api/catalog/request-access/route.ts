import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCatalogAccessRequestEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email, role, lookingFor } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('catalog_access_requests')
    .insert({ email, role, looking_for: lookingFor ?? null });

  if (error) {
    console.error('catalog_access_requests insert error:', error);
    return NextResponse.json({ error: 'Could not save request.' }, { status: 500 });
  }

  await sendCatalogAccessRequestEmail({ email, role, lookingFor: lookingFor ?? '' });

  return NextResponse.json({ success: true });
}
