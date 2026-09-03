import type { User } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { addNotification } from '@/lib/notifications';
import { sendReferralCreditEmail } from '@/lib/email';
import { siteUrl } from '@/lib/site-url';

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

  const joinerName =
    typeof newUser.user_metadata?.full_name === 'string'
      ? newUser.user_metadata.full_name.trim().split(/\s+/)[0]
      : 'A composer';

  try {
    await addNotification(admin, referredBy, {
      type: 'referral_credit',
      title: 'You earned a submission credit',
      body: `${joinerName || 'A composer'} joined Sonant from your invite.`,
      href: `/profile/${referredBy}#alerts`,
    });
  } catch (error) {
    console.error('Referral notification failed:', error);
  }

  const { data: referrerUser } = await admin.auth.admin.getUserById(referredBy);
  const referrerEmail = referrerUser.user?.email;
  if (referrerEmail) {
    await sendReferralCreditEmail({
      to: referrerEmail,
      joinerName: joinerName || 'A composer',
      profileUrl: `${siteUrl()}/profile/${referredBy}#alerts`,
    });
  }

  revalidatePath(`/profile/${referredBy}`);
  return { credited: true as const, referredBy };
}
