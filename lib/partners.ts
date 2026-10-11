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
  focus: string;
  blurb: string;
  /** Shown to a composer when this catalog accepts their track. */
  terms: string[];
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
    focus: 'Brand',
    terms: [
      'Exclusive. Once accepted, the track lives only in the Thought Collective catalog.',
      'Sync fees split 50/50 between you and Thought Collective.',
      'Thought Collective pitches the track to agencies and brands.',
    ],
    blurb:
      'A sync catalog built for brand work. Their briefs come from what agencies and brands are asking for right now, and accepted tracks get pitched to them directly.',
    digestContactEmail: 'jack@wearethoughtcollective.com',
  },
  sonant: {
    id: 'sonant',
    name: 'Sonant',
    site: 'https://sonant.ac',
    catalogUrl: SONANT_CATALOG,
    markSrc: '',
    exclusive: false,
    split: '50/50',
    focus: 'Brand, film, games',
    terms: [
      'Non-exclusive. You can keep pitching the track anywhere else.',
      'Sync fees split 50/50 between you and Sonant.',
      'Sonant pitches the track directly.',
    ],
    blurb:
      'Our own catalog, pitched by the Sonant team. It is newer and still growing. Placements here stay non-exclusive, so the music is yours to pitch anywhere else too.',
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
