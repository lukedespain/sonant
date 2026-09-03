import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listNotifications, markNotificationsRead, unreadCount } from '@/lib/notifications';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await listNotifications(createAdminClient(), user.id);
  return NextResponse.json({ notifications: items, unread: unreadCount(items) });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids = body.all === true ? 'all' : Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : [];
  if (ids !== 'all' && ids.length === 0) {
    return NextResponse.json({ error: 'Nothing to mark read.' }, { status: 400 });
  }

  const items = await markNotificationsRead(createAdminClient(), user.id, ids);
  return NextResponse.json({ notifications: items, unread: unreadCount(items) });
}
