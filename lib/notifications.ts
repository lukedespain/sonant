import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'community-tracks';
const MAX_ITEMS = 50;

export type NotificationType =
  | 'referral_credit'
  | 'brief_upload'
  | 'catalog_accepted'
  | 'catalog_reviewed';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
};

function keyFor(userId: string) {
  return `_meta/notifications/${userId}.json`;
}

async function readList(admin: SupabaseClient, userId: string): Promise<AppNotification[]> {
  const { data, error } = await admin.storage.from(BUCKET).download(keyFor(userId));
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text()) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AppNotification => {
      return !!item && typeof item === 'object' && typeof (item as AppNotification).id === 'string';
    });
  } catch {
    return [];
  }
}

async function writeList(admin: SupabaseClient, userId: string, items: AppNotification[]) {
  const { error } = await admin.storage.from(BUCKET).upload(keyFor(userId), JSON.stringify(items), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) throw new Error(error.message);
}

export async function listNotifications(admin: SupabaseClient, userId: string) {
  return readList(admin, userId);
}

export async function addNotification(
  admin: SupabaseClient,
  userId: string,
  input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
) {
  const items = await readList(admin, userId);
  const next: AppNotification = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await writeList(admin, userId, [next, ...items].slice(0, MAX_ITEMS));
  return next;
}

export async function markNotificationsRead(
  admin: SupabaseClient,
  userId: string,
  ids: string[] | 'all'
) {
  const items = await readList(admin, userId);
  const updated = items.map((item) =>
    ids === 'all' || ids.includes(item.id) ? { ...item, read: true } : item
  );
  await writeList(admin, userId, updated);
  return updated;
}

export function unreadCount(items: AppNotification[]) {
  return items.filter((item) => !item.read).length;
}
