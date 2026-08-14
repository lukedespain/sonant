import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyReferralCredit, safeInternalPath } from '@/lib/referrals';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error && data.user) {
      await applyReferralCredit(data.user);
      const accountType = data.user.user_metadata?.account_type;
      const fromMeta = safeInternalPath(data.user.user_metadata?.signup_next);
      const dest =
        accountType === 'business'
          ? '/account'
          : fromMeta ?? '/browse';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
