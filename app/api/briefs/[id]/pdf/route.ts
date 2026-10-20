import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { classifyBrief } from '@/lib/brief-kind';
import { composerHasClientAccess } from '@/lib/verification';
import { CATALOG_PARTNERS, catalogPartnerFromBrief } from '@/lib/partners';
import type { Brief } from '@/components/BriefDocument';
import BriefPdf from '@/lib/pdf/BriefPdf';

export const runtime = 'nodejs';

async function loadImage(url: string | undefined): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const type = res.headers.get('content-type') ?? '';
    // react-pdf only embeds JPEG and PNG.
    if (!res.ok || !/image\/(jpeg|jpg|png)/.test(type)) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function fileName(title: string) {
  const clean = title.replace(/[^\w\s&-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Brief';
  return `Sonant - Project ${clean}.pdf`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: row } = await admin
    .from('briefs')
    .select('id, user_id, brief_type, generated_content')
    .eq('id', id)
    .maybeSingle();
  if (!row) return new Response('Brief not found.', { status: 404 });

  const kind = classifyBrief(row);
  if (kind === 'client') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const allowed = !!user && (isSiteAdmin(user) || (await composerHasClientAccess(admin, user.id, false)));
    if (!allowed) return new Response('Verified composers only.', { status: 403 });
  }

  const brief = row.generated_content as Brief;
  const partner = kind === 'catalog' ? catalogPartnerFromBrief(brief) ?? CATALOG_PARTNERS.sonant : null;
  const houseLabel =
    kind === 'client' ? 'Client brief' : partner ? `${partner.name} catalog brief` : 'Practice brief';

  const image = await loadImage(brief.imageUrl);
  const pdf = await renderToBuffer(createElement(BriefPdf, { brief, partner, houseLabel, image }) as Parameters<typeof renderToBuffer>[0]);

  const title = brief.projectTitle || brief.codename || 'Brief';
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName(title)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
