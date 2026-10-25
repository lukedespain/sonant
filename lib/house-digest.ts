export const HOUSE_DIGEST_INTRO =
  'Here are the new tracks I recommend for your catalog this week. Everything is in one Disco playlist so you can listen the way you already work.';

export const HOUSE_DIGEST_CLOSING = 'Let me know if you have any questions.\n\nCheers,\nLuke';

/** "jack@wearethoughtcollective.com" becomes "Jack" for the greeting. */
export function greetingNameFromEmail(email: string): string {
  const first = email.trim().split('@')[0]?.split(/[._+-]/)[0] ?? '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
}

/** A blank line starts a new bullet. Line breaks inside a pick stay in that bullet. */
export function splitDigestPicks(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}
