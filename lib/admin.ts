import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS, ADMIN_USER_ID } from '@/lib/admin-ids';

export { ADMIN_EMAILS, ADMIN_USER_ID };

export function isSiteAdmin(user: { id: string; email?: string | null } | null | undefined): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase() ?? '';
  return user.id === ADMIN_USER_ID || (ADMIN_EMAILS as readonly string[]).includes(email);
}

export async function requireSiteAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) redirect('/');
  return user!;
}
