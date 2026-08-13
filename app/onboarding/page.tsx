import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signup');

  // If account_type was set at signup, skip straight to the right destination
  const accountType = user.user_metadata?.account_type;
  if (accountType === 'business') redirect('/account');
  if (accountType === 'composer') redirect('/browse');

  // Fallback: show the picker (edge case — old accounts or missing metadata)
  return <OnboardingClient />;
}
