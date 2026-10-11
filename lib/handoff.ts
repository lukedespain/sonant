// Composer rights info lives on auth user_metadata.rights (the composer edits it).
// Catalog handoffs live on auth app_metadata.handoffs, keyed by submission id,
// because only the service role can write app_metadata: an agreement cannot be
// forged from the browser.

export type RightsInfo = {
  legalName: string;
  pro: string;
  composerIpi: string;
  publisherName: string;
  publisherIpi: string;
};

export type Handoff = {
  catalogId: string;
  offeredAt: string;
  agreedAt?: string;
  stemsUrl?: string;
};

export const EMPTY_RIGHTS: RightsInfo = {
  legalName: '',
  pro: '',
  composerIpi: '',
  publisherName: '',
  publisherIpi: '',
};

export const PRO_OPTIONS = ['ASCAP', 'BMI', 'SESAC', 'GMR', 'SOCAN', 'PRS', 'APRA AMCOS', 'GEMA', 'SACEM'];

function str(value: unknown, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function readRights(userMetadata: unknown): RightsInfo {
  const raw = (userMetadata as { rights?: Record<string, unknown> } | null)?.rights ?? {};
  return {
    legalName: str(raw.legalName),
    pro: str(raw.pro),
    composerIpi: str(raw.composerIpi, 20),
    publisherName: str(raw.publisherName),
    publisherIpi: str(raw.publisherIpi, 20),
  };
}

export function readHandoffs(appMetadata: unknown): Record<string, Handoff> {
  const raw = (appMetadata as { handoffs?: unknown } | null)?.handoffs;
  if (!raw || typeof raw !== 'object') return {};
  return raw as Record<string, Handoff>;
}

const IPI = /^\d{9,11}$/;

/** Returns an error message, or null when the info is complete enough to hand off. */
export function validateRights(rights: RightsInfo): string | null {
  if (!rights.legalName) return 'Add your legal name.';
  if (!rights.pro) return 'Add your PRO.';
  if (!IPI.test(rights.composerIpi.replace(/\s/g, ''))) return 'Your composer IPI should be 9 to 11 digits.';
  if (rights.publisherIpi && !IPI.test(rights.publisherIpi.replace(/\s/g, ''))) {
    return 'Your publisher IPI should be 9 to 11 digits.';
  }
  if (rights.publisherIpi && !rights.publisherName) return 'Add the publisher name that goes with that IPI.';
  return null;
}

export function normalizeRights(rights: RightsInfo): RightsInfo {
  return {
    ...rights,
    composerIpi: rights.composerIpi.replace(/\s/g, ''),
    publisherIpi: rights.publisherIpi.replace(/\s/g, ''),
  };
}

export function validateStemsUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? null : 'Paste a full link that starts with https://';
  } catch {
    return 'Paste a full link that starts with https://';
  }
}
