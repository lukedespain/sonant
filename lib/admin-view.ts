import { cookies } from 'next/headers';
import { isSiteAdmin } from '@/lib/admin';

/** Admins can preview the site as a composer. Only the UI changes; permissions do not. */
export const VIEW_COOKIE = 'tc_view';

type UserLike = { id: string; email?: string | null } | null | undefined;

export async function viewingAsComposer(user: UserLike) {
  if (!isSiteAdmin(user)) return false;
  return (await cookies()).get(VIEW_COOKIE)?.value === 'composer';
}

/** Admin for display purposes: a real admin who has not switched to the composer view. */
export async function isAdminView(user: UserLike) {
  return isSiteAdmin(user) && !(await viewingAsComposer(user));
}
