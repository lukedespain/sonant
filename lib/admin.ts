import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

export const ADMIN_EMAILS = ['luke@sonant.ac', 'hello@sonant.ac'] as const;

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
