/**
 * A composer's "sound": the genres and moods they usually write. Briefs use it
 * to sort a For you view. Stored on the user's user_metadata.sound.
 */

export type Sound = { genres: string[]; moods: string[] };

export const GENRE_OPTIONS = [
  'Electronic', 'Hip-Hop', 'Pop', 'Rock', 'Indie', 'R&B', 'Soul', 'Funk', 'Jazz', 'Folk', 'Country',
  'Orchestral', 'Cinematic', 'Ambient', 'Classical', 'Lo-Fi', 'Synth Pop', 'Trap', 'House', 'Afrobeat',
  'Latin', 'World', 'Experimental', 'Percussion',
];

export const MOOD_OPTIONS = [
  'Uplifting', 'Hopeful', 'Energetic', 'Confident', 'Playful', 'Cool', 'Moody', 'Dark', 'Tense', 'Epic',
  'Emotional', 'Nostalgic', 'Dreamy', 'Romantic', 'Melancholic', 'Aggressive', 'Quirky', 'Calm',
];

export const norm = (t: string) => t.trim().toLowerCase();
export const titleCase = (t: string) =>
  t.trim().replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

function clean(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of list) {
    if (typeof v !== 'string') continue;
    const t = titleCase(v).slice(0, 40);
    if (!t || seen.has(norm(t))) continue;
    seen.add(norm(t));
    out.push(t);
  }
  return out.slice(0, 12);
}

export function readSound(userMetadata: unknown): Sound {
  const raw = (userMetadata as { sound?: { genres?: unknown; moods?: unknown } } | null)?.sound;
  return { genres: clean(raw?.genres), moods: clean(raw?.moods) };
}

export function normalizeSound(input: unknown): Sound {
  const raw = (input ?? {}) as { genres?: unknown; moods?: unknown };
  return { genres: clean(raw.genres), moods: clean(raw.moods) };
}

/** Tags on a brief that match the composer's sound, case-insensitively. */
export function soundMatches(sound: Sound, brief: { genres: string[]; moods?: string[] }) {
  const mine = new Set([...sound.genres, ...sound.moods].map(norm));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...brief.genres, ...(brief.moods ?? [])]) {
    const k = norm(t);
    if (mine.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(titleCase(t));
    }
  }
  return out;
}

/** The option list: the curated set plus any tag already used on a brief. */
export function mergeOptions(base: string[], extra: string[]) {
  const seen = new Set(base.map(norm));
  const out = [...base];
  for (const t of extra) {
    const k = norm(t);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(titleCase(t));
  }
  return out;
}
