import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BUCKET = 'community-tracks';
const KEY = '_meta/referral-codes.json';
const CODE_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode() {
  const bytes = randomBytes(8);
  let raw = '';
  for (const byte of bytes) raw += ALPHABET[byte % ALPHABET.length];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function readMap(admin: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await admin.storage.from(BUCKET).download(KEY);
  if (error || !data) return {};
  try {
    const parsed = JSON.parse(await data.text()) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeMap(admin: SupabaseClient, map: Record<string, string>) {
  const { error } = await admin.storage.from(BUCKET).upload(KEY, JSON.stringify(map), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) throw new Error(error.message);
}

export function isReferralCode(value: unknown): value is string {
  return typeof value === 'string' && CODE_RE.test(value.trim().toUpperCase());
}

export async function getOrCreateReferralCode(
  admin: SupabaseClient,
  userId: string,
  existingMetaCode?: unknown
): Promise<string> {
  const map = await readMap(admin);
  const stored = Object.entries(map).find(([, id]) => id === userId)?.[0];
  if (stored) return stored;

  if (typeof existingMetaCode === 'string' && CODE_RE.test(existingMetaCode)) {
    if (!map[existingMetaCode] || map[existingMetaCode] === userId) {
      map[existingMetaCode] = userId;
      await writeMap(admin, map);
      return existingMetaCode;
    }
  }

  let code = makeCode();
  while (map[code]) code = makeCode();
  map[code] = userId;
  await writeMap(admin, map);
  return code;
}

export async function resolveReferrerId(
  admin: SupabaseClient,
  ref: unknown
): Promise<string | null> {
  if (typeof ref === 'string' && UUID_RE.test(ref)) return ref;
  if (typeof ref !== 'string') return null;
  const code = ref.trim().toUpperCase();
  if (!CODE_RE.test(code)) return null;
  const map = await readMap(admin);
  return map[code] ?? null;
}
