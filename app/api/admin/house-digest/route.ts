import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/admin';
import { sendHouseCatalogDigestEmail } from '@/lib/email';
import { catalogPartnerById, DEFAULT_CATALOG_PARTNER_ID } from '@/lib/partners';
import { siteUrl } from '@/lib/site-url';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const partnerId =
    typeof body?.partnerId === 'string' ? body.partnerId : DEFAULT_CATALOG_PARTNER_ID;
  const partner = catalogPartnerById(partnerId);
  if (!partner) {
    return NextResponse.json({ error: 'Unknown catalog partner.' }, { status: 400 });
  }

  const to = String(body?.to ?? '').trim();
  const discoPlaylistUrl = String(body?.discoPlaylistUrl ?? '').trim();
  const note = typeof body?.note === 'string' ? body.note : '';
  const tracksRaw = typeof body?.tracks === 'string' ? body.tracks : '';
  const tracks = tracksRaw
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean);

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'Add a valid recipient email.' }, { status: 400 });
  }
  if (!discoPlaylistUrl || !/^https?:\/\//i.test(discoPlaylistUrl)) {
    return NextResponse.json({ error: 'Add a valid Disco playlist URL.' }, { status: 400 });
  }

  const result = await sendHouseCatalogDigestEmail({
    to,
    houseName: partner.name,
    discoPlaylistUrl,
    tracks,
    note,
    briefsUrl: `${siteUrl()}/briefs?tab=catalog`,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
