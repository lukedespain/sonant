import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_USER_ID } from '@/lib/admin';
import { COMMUNITY_BUCKET, SUBMISSION_BUCKET } from '@/lib/audio-upload';

/**
 * Remove a composer's app data, then the Auth user.
 * Call only after the requester has been authenticated as this user (or an admin).
 */
export async function deleteUserAccount(
  admin: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (userId === ADMIN_USER_ID) {
    return { ok: false, message: 'This account cannot be deleted.' };
  }

  const { data: tracks } = await admin
    .from('community_tracks')
    .select('id, storage_path, brief_id')
    .eq('user_id', userId);

  const storagePaths = (tracks ?? [])
    .map((t) => t.storage_path as string | null)
    .filter((p): p is string => !!p);
  if (storagePaths.length) {
    await admin.storage.from(COMMUNITY_BUCKET).remove(storagePaths);
  }

  const { data: submissions } = await admin
    .from('submissions')
    .select('id')
    .eq('user_id', userId);
  const submissionIds = (submissions ?? []).map((s) => s.id as string);
  if (submissionIds.length) {
    await admin.storage.from(SUBMISSION_BUCKET).remove(
      submissionIds.flatMap((id) => [`${id}`, `${id}/`])
    );
    for (const id of submissionIds) {
      const { data: objects } = await admin.storage.from(SUBMISSION_BUCKET).list(id);
      const names = (objects ?? []).map((o) => `${id}/${o.name}`);
      if (names.length) await admin.storage.from(SUBMISSION_BUCKET).remove(names);
    }
  }

  const { data: briefs } = await admin.from('briefs').select('id').eq('user_id', userId);
  const briefIds = (briefs ?? []).map((b) => b.id as string);
  if (briefIds.length) {
    await admin
      .from('briefs')
      .update({ featured_track_id: null, featured_track_url: null })
      .in('id', briefIds);
  }

  const steps: Array<{ label: string; run: () => PromiseLike<{ error: { message: string } | null }> }> = [
    { label: 'tracks', run: () => admin.from('community_tracks').delete().eq('user_id', userId) },
    { label: 'submissions', run: () => admin.from('submissions').delete().eq('user_id', userId) },
    { label: 'bookings', run: () => admin.from('bookings').delete().eq('user_id', userId) },
    { label: 'brief jobs', run: () => admin.from('brief_jobs').delete().eq('user_id', userId) },
    { label: 'briefs', run: () => admin.from('briefs').delete().eq('user_id', userId) },
  ];

  for (const step of steps) {
    const { error } = await step.run();
    if (error) return { ok: false, message: `Could not remove ${step.label}: ${error.message}` };
  }

  const avatarPrefixes = [`${userId}`];
  for (const prefix of avatarPrefixes) {
    const { data: objects } = await admin.storage.from('avatars').list(prefix);
    const names = (objects ?? []).map((o) => `${prefix}/${o.name}`);
    if (names.length) await admin.storage.from('avatars').remove(names);
  }

  const { error: profileError } = await admin.from('profiles').delete().eq('id', userId);
  if (profileError) return { ok: false, message: profileError.message };

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { ok: false, message: authError.message };

  return { ok: true };
}
