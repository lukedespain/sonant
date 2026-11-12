import { redirect } from 'next/navigation';

// Every account is a composer account, so there is nothing to pick.
export default function OnboardingPage() {
  redirect('/briefs');
}
