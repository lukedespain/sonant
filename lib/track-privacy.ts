import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'community-tracks';
const KEY = '_meta/privacy.json';

/** Storage answers a GET for an object that is not there with a 400 and this body. */
async function isAbsent(res: Response) {
  if (res.status === 404) return true;
  if (res.status !== 400) return false;
  try {
    const body = (await res.clone().json()) as { statusCode?: string; code?: string };
    return body.statusCode === '404' || body.code === 'NoSuchKey';
  } catch {
    return false;
  }
}

/**
 * Missing keys are public. Stored values of `false` mean private.
 *
 * Throws if the map cannot be read. That matters in both directions: a caller
 * rendering a page would otherwise show every private track, and setTrackPublic
 * rewrites this file whole, so writing on top of a failed read would erase
 * everyone else's setting. Only a genuinely absent file is an empty map.
 */
export async function getTrackPrivacyMap(
  admin = createAdminClient()
): Promise<Record<string, boolean>> {
  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(KEY);
  // Storage serves this through a CDN. The unique query string below does not
  // actually defeat that cache — the cache key ignores it — so freshness rests
  // on writing the object with `cacheControl: '0'`, which does work. It is left
  // in only because removing it cannot help and might expose a wrong reading.
  const fresh = `${publicUrl}?t=${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await fetch(fresh, { cache: 'no-store' });

  if (!res.ok) {
    if (await isAbsent(res)) return {};
    throw new Error(`Could not read track privacy settings (${res.status}).`);
  }

  const parsed = JSON.parse(await res.text()) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Track privacy settings are not in the expected shape.');
  }
  return parsed as Record<string, boolean>;
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
    cacheControl: '0',
  });
  if (error) throw new Error(error.message);
}
