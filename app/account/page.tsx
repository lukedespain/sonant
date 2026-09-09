import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { ensureMonthlySubmissionCredit } from '@/lib/monthly-credit';
import { listNotifications } from '@/lib/notifications';
import AccountView from './AccountView';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account');

  const admin = createAdminClient();
  const monthly = await ensureMonthlySubmissionCredit(admin, user);
  const [{ data: profile }, notifications] = await Promise.all([
    admin
      .from('profiles')
      .select('full_name, email, submission_credits')
      .eq('id', user.id)
      .single(),
    listNotifications(admin, user.id),
  ]);

  return (
    <AccountView
      name={(profile as { full_name?: string } | null)?.full_name ?? ''}
      email={
        (profile as { email?: string | null } | null)?.email
        ?? user.email
        ?? ''
      }
      isAdmin={isSiteAdmin(user)}
      submissionCredits={
        monthly?.credits
        ?? (profile as { submission_credits?: number } | null)?.submission_credits
        ?? 0
      }
      daysUntilNextCredit={monthly?.daysUntilNext ?? null}
      notifications={notifications}
    />
  );
}
