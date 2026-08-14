import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUserId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://')) return null;
  return value;
}

export async function applyReferralCredit(newUser: User | null | undefined) {
  if (!newUser) return { credited: false as const };

  const meta = (newUser.user_metadata ?? {}) as Record<string, unknown>;
  const referredBy = meta.referred_by;
  if (!isUserId(referredBy)) return { credited: false as const };
  if (referredBy === newUser.id) return { credited: false as const };
  if (meta.referral_credited === true) return { credited: false as const };

  const admin = createAdminClient();
  const { data: referrer } = await admin
    .from('profiles')
    .select('id')
    .eq('id', referredBy)
    .maybeSingle();

  if (!referrer) return { credited: false as const };

  const { error: creditError } = await admin.rpc('increment_credits', {
    p_user_id: referredBy,
    p_submission_delta: 1,
    p_session_delta: 0,
  });

  if (creditError) {
    console.error('Referral credit failed:', creditError);
    return { credited: false as const, error: creditError.message };
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(newUser.id, {
    user_metadata: { ...meta, referral_credited: true },
  });

  if (metaError) {
    console.error('Could not mark referral as credited:', metaError);
  }

  return { credited: true as const, referredBy };
}
