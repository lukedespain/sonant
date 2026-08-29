import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Accepted catalog placements a composer needs before paid client briefs unlock. */
export const VERIFICATION_THRESHOLD = 3;

/**
 * Manual badge override on `profiles.verified_override`.
 * `null` means use the automatic three-accepted rule.
 */
export type VerifiedOverride = boolean | null;

/**
 * Accepted submissions written against catalog briefs. Client-brief placements
 * are excluded on purpose: counting them would let accepted client work grant
 * the very access that client work requires.
 */
export async function countAcceptedCatalogSubmissions(
  admin: AdminClient,
  userId: string
): Promise<number> {
  const [{ count }, manual] = await Promise.all([
    admin
      .from('submissions')
      .select('id, briefs!inner(brief_type)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .neq('briefs.brief_type', 'client'),
    readManualCatalogPlacements(admin, userId),
  ]);
  return (count ?? 0) + manual;
}

/**
 * Placements added by hand on `profiles.manual_catalog_placements`.
 * Returns 0 when the column is missing or unset.
 */
export async function readManualCatalogPlacements(
  admin: AdminClient,
  userId: string
): Promise<number> {
  const { data, error } = await admin
    .from('profiles')
    .select('manual_catalog_placements')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return 0;
  const value = (data as { manual_catalog_placements?: number | null }).manual_catalog_placements;
  return typeof value === 'number' && value > 0 ? Math.floor(value) : 0;
}

export function isVerifiedComposer(
  acceptedCatalogCount: number,
  override: VerifiedOverride = null
): boolean {
  if (override === true) return true;
  if (override === false) return false;
  return acceptedCatalogCount >= VERIFICATION_THRESHOLD;
}

/**
 * Reads the manual override. Returns `null` when the column is missing or
 * unset, so the automatic rule still applies before the migration has run.
 */
export async function readVerifiedOverride(
  admin: AdminClient,
  userId: string
): Promise<VerifiedOverride> {
  const { data, error } = await admin
    .from('profiles')
    .select('verified_override')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const value = (data as { verified_override?: boolean | null }).verified_override;
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

export async function composerHasClientAccess(
  admin: AdminClient,
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true;
  const [count, override] = await Promise.all([
    countAcceptedCatalogSubmissions(admin, userId),
    readVerifiedOverride(admin, userId),
  ]);
  return isVerifiedComposer(count, override);
}

export function suggestedDiscoFilename(briefName: string, composerName: string): string {
  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[^\w\s-]+/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'track';
  return `${slug(briefName)}_${slug(composerName || 'composer')}.wav`;
}
