export const THOUGHT_COLLECTIVE_SITE = 'https://www.wearethoughtcollective.com/';
export const THOUGHT_COLLECTIVE_CATALOG =
  'https://wearethoughtcollective.disco.ac/cat/1526278692';

export type CatalogPartner = {
  id: string;
  name: string;
  site: string;
  catalogUrl: string;
  markSrc: string;
  exclusive: boolean;
  split: string;
};

export const CATALOG_PARTNERS: Record<string, CatalogPartner> = {
  'thought-collective': {
    id: 'thought-collective',
    name: 'Thought Collective',
    site: THOUGHT_COLLECTIVE_SITE,
    catalogUrl: THOUGHT_COLLECTIVE_CATALOG,
    markSrc: '/brand/thought-collective-mark.svg',
    exclusive: true,
    split: '50/50',
  },
};

export const DEFAULT_CATALOG_PARTNER_ID = 'thought-collective';

export function catalogPartnerById(id: string | null | undefined): CatalogPartner | null {
  if (!id) return null;
  return CATALOG_PARTNERS[id] ?? null;
}

export function catalogPartnerFromBrief(content: unknown): CatalogPartner | null {
  if (!content || typeof content !== 'object') return null;
  const row = content as { catalogId?: unknown; catalog?: { id?: unknown } | null };
  const id =
    typeof row.catalogId === 'string'
      ? row.catalogId
      : typeof row.catalog?.id === 'string'
        ? row.catalog.id
        : null;
  return catalogPartnerById(id);
}
