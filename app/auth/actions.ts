'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUserId, safeInternalPath } from '@/lib/referrals';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveReferrerId } from '@/lib/referral-codes';
import { siteUrl } from '@/lib/site-url';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const accountType = (formData.get('accountType') as string) || 'composer';
  const referredByRaw = formData.get('referredBy');
  const signupNext = safeInternalPath(formData.get('signupNext'));
  const referredBy = isUserId(referredByRaw)
    ? referredByRaw
    : await resolveReferrerId(createAdminClient(), referredByRaw);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: accountType,
        ...(referredBy ? { referred_by: referredBy } : {}),
        ...(signupNext ? { signup_next: signupNext } : {}),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/confirm?next=/browse`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string | null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  // Only follow relative paths to prevent open redirect
  const safePath = redirectTo?.startsWith('/') ? redirectTo : '/browse';
  redirect(safePath);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  if (!email) return { error: 'Email is required.' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/update-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'This reset link is invalid or expired.' };

  const password = formData.get('password') as string | null;
  const confirm = formData.get('confirm') as string | null;
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/account');
}
