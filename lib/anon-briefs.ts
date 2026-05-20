// Client-side stash for briefs generated before a user signs up.
// Per-browser only. Imported into the user's account on first
// authenticated visit to /library, then cleared.

const STORAGE_KEY = 'sonant_anon_briefs';

export interface AnonBrief {
  mode: 'brand' | 'film' | 'games';
  target: string;
  genres: string[];
  moods: string[];
  generatedContent: Record<string, unknown>;
  stashedAt: string;
}

// Read all stashed briefs. Returns [] if none or if storage is unavailable.
export function getAnonBriefs(): AnonBrief[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Append one brief to the stash.
export function addAnonBrief(brief: Omit<AnonBrief, 'stashedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getAnonBriefs();
    existing.push({ ...brief, stashedAt: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Storage full or disabled — fail silently. The brief just won't persist.
  }
}

// Clear the stash. Called after a successful import.
export function clearAnonBriefs(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}