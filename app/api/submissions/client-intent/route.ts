import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { composerHasClientAccess } from '@/lib/verification';
import { isClientBriefRecord, resolveDiscoInboxUrl } from '@/lib/disco';
import { revalidatePath } from 'next/cache';

const RECENT_MS = 10 * 60 * 1000;

/**
 * Logs that a verified composer is going to Disco for a client brief.
 * Never spends a credit and never stores audio.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const briefId = typeof body.briefId === 'string' ? body.briefId : null;
  if (!briefId) {
    return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
  }

  const admin = createAdminClient();
  const allowed = await composerHasClientAccess(admin, user.id, isSiteAdmin(user));
  if (!allowed) {
    return NextResponse.json(
      { error: 'Client briefs are for verified composers.' },
      { status: 403 }
    );
  }

  let briefQuery = await admin
    .from('briefs')
    .select('id, brief_type, generated_content, disco_inbox_url')
    .eq('id', briefId)
    .single();
  if (briefQuery.error && /disco_inbox_url/i.test(briefQuery.error.message ?? '')) {
    briefQuery = await admin
      .from('briefs')
      .select('id, brief_type, generated_content')
      .eq('id', briefId)
      .single();
  }

  if (briefQuery.error || !briefQuery.data) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const row = briefQuery.data as {
    brief_type?: string | null;
    generated_content?: { kind?: string } | null;
    disco_inbox_url?: string | null;
  };
  if (!isClientBriefRecord(row)) {
    return NextResponse.json(
      { error: 'This brief takes a catalog submission, not a Disco delivery.' },
      { status: 400 }
    );
  }

  const url = resolveDiscoInboxUrl(row.disco_inbox_url);
  if (!url) {
    return NextResponse.json(
      { error: 'This brief does not have a Disco inbox yet. Tell the Sonant team.' },
      { status: 404 }
    );
  }

  const since = new Date(Date.now() - RECENT_MS).toISOString();
  const { data: recent } = await admin
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('brief_id', briefId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recent) {
    const fullInsert = {
      user_id: user.id,
      brief_id: briefId,
      status: 'received',
      delivery: 'disco',
      disco_inbox_url: url,
    };
    const { error } = await admin.from('submissions').insert(fullInsert);
    if (error) {
      const missingColumn = /delivery|disco_inbox_url/i.test(error.message ?? '');
      if (missingColumn) {
        const fallback = await admin.from('submissions').insert({
          user_id: user.id,
          brief_id: briefId,
          status: 'received',
        });
        if (fallback.error) {
          console.error('Could not log Disco click', fallback.error);
        }
      } else {
        console.error('Could not log Disco click', error);
      }
    }
  }

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/submissions');
  revalidatePath('/admin');
  return NextResponse.json({ url });
}
