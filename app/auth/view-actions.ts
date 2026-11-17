'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/admin';
import { VIEW_COOKIE } from '@/lib/admin-view';

export async function setSiteView(mode: 'admin' | 'composer') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return { error: 'Not authorized.' };
  const jar = await cookies();
  if (mode === 'composer') {
    jar.set(VIEW_COOKIE, 'composer', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  } else {
    jar.delete(VIEW_COOKIE);
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}
