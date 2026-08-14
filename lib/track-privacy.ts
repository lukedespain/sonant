import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'community-tracks';
const KEY = '_meta/privacy.json';

/** Missing keys are public. Stored values of `false` mean private. */
export async function getTrackPrivacyMap(
  admin = createAdminClient()
): Promise<Record<string, boolean>> {
  const { data, error } = await admin.storage.from(BUCKET).download(KEY);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text()) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function isTrackPublic(map: Record<string, boolean>, trackId: string) {
  return map[trackId] !== false;
}

export async function setTrackPublic(trackId: string, isPublic: boolean) {
  const admin = createAdminClient();
  const map = await getTrackPrivacyMap(admin);
  if (isPublic) delete map[trackId];
  else map[trackId] = false;
  const { error } = await admin.storage.from(BUCKET).upload(KEY, JSON.stringify(map), {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) throw new Error(error.message);
}
