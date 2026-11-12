// What an accepted track is good for, set by an admin when accepting it.
// Stored on the composer's auth app_metadata.trackTags, keyed by submission
// id, so only the service role can write it and composers never see it.

export type TrackTags = {
  genres: string[];
  moods: string[];
  taggedAt: string;
};

export function readTrackTags(appMetadata: unknown): Record<string, TrackTags> {
  const raw = (appMetadata as { trackTags?: unknown } | null)?.trackTags;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, TrackTags> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const v = value as Partial<TrackTags> | null;
    if (!v) continue;
    out[id] = {
      genres: Array.isArray(v.genres) ? v.genres.filter((g): g is string => typeof g === 'string') : [],
      moods: Array.isArray(v.moods) ? v.moods.filter((m): m is string => typeof m === 'string') : [],
      taggedAt: typeof v.taggedAt === 'string' ? v.taggedAt : '',
    };
  }
  return out;
}

/** Trims tags, drops blanks and case-insensitive duplicates, and caps the list at 12. */
export function normalizeTagList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
    if (out.length >= 12) break;
  }
  return out;
}

export function tagProblem(tags: { genres: string[]; moods: string[] }): string | null {
  if (tags.genres.length === 0 || tags.moods.length === 0) {
    return 'Tag at least one genre and one mood this track nails.';
  }
  return null;
}

/** app_metadata with one track's tags set, leaving everything else as it was. */
export function withTrackTags(
  appMetadata: Record<string, unknown> | undefined,
  submissionId: string,
  tags: { genres: string[]; moods: string[] },
): Record<string, unknown> {
  const current = readTrackTags(appMetadata);
  current[submissionId] = { genres: tags.genres, moods: tags.moods, taggedAt: new Date().toISOString() };
  return { ...(appMetadata ?? {}), trackTags: current };
}
