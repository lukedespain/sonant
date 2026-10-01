export const THOUGHT_COLLECTIVE_SITE = 'https://www.wearethoughtcollective.com/';
export const THOUGHT_COLLECTIVE_CATALOG =
  'https://wearethoughtcollective.disco.ac/cat/1526278692';
export const SONANT_CATALOG = 'https://sonant.disco.ac/cat/152887908';

export type CatalogPartner = {
  id: string;
  name: string;
  site: string;
  catalogUrl: string;
  markSrc: string;
  exclusive: boolean;
  split: string;
  /** Default recipient for weekly catalog picks (override in admin before send). */
  digestContactEmail?: string;
};

export const CATALOG_PARTNERS: Record<string, CatalogPartner> = {
  'thought-collective': {
    id: 'thought-collective',
    name: 'Thought Collective',
    site: THOUGHT_COLLECTIVE_SITE,
    catalogUrl: THOUGHT_COLLECTIVE_CATALOG,
    markSrc: '/brand/thought-collective-mark.png',
    exclusive: true,
    split: '50/50',
    digestContactEmail: 'jack@wearethoughtcollective.com',
  },
  sonant: {
    id: 'sonant',
    name: 'Sonant',
    site: 'https://sonant.ac',
    catalogUrl: SONANT_CATALOG,
    markSrc: '',
    exclusive: false,
    split: '70/30 in your favor',
  },
};

export const CATALOG_PARTNER_LIST = Object.values(CATALOG_PARTNERS);

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
