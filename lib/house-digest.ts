export const HOUSE_DIGEST_INTRO =
  'I reviewed new submissions from Sonant catalog briefs. The tracks below are the ones I recommend for your catalog right now. Everything is in one Disco playlist so you can listen the way you already work.';

export const HOUSE_DIGEST_CLOSING =
  'Some of these tracks were written to a Sonant brief for practice, and they were strong enough to send to your catalog. Links to the briefs the composers wrote to are in the client notes on Disco.';

/** A blank line starts a new bullet. Line breaks inside a pick stay in that bullet. */
export function splitDigestPicks(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}
