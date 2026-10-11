import type { createAdminClient } from '@/lib/supabase/admin';
import { SUBMISSION_BUCKET } from '@/lib/audio-upload';

/** Uploaded file name for a submission, read from its storage folder. */
export async function submissionFileName(
  admin: ReturnType<typeof createAdminClient>,
  submissionId: string,
): Promise<string | null> {
  const { data } = await admin.storage.from(SUBMISSION_BUCKET).list(submissionId, { limit: 20 });
  return (data ?? []).find((entry) => entry.name && !entry.name.endsWith('/'))?.name ?? null;
}
