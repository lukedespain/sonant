import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/admin';
import { sendHouseCatalogDigestEmail } from '@/lib/email';
import { splitDigestPicks } from '@/lib/house-digest';
import { catalogPartnerById, DEFAULT_CATALOG_PARTNER_ID } from '@/lib/partners';

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
  const intro = typeof body?.intro === 'string' ? body.intro : '';
  const closing = typeof body?.closing === 'string' ? body.closing : '';
  const tracksRaw = typeof body?.tracks === 'string' ? body.tracks : '';
  const tracks = splitDigestPicks(tracksRaw);
  const test = body?.test === true;

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
    intro,
    tracks,
    closing,
    test,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
