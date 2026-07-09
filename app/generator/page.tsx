import { createClient } from '@/lib/supabase/server';
import BriefGenerator from '@/components/BriefGenerator';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

export default async function GeneratorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userInfo = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    userInfo = {
      email: user.email || '',
      fullName: profile?.full_name || '',
    };
  }

  const isAdmin = user?.id === ADMIN_USER_ID;

  return <BriefGenerator user={userInfo} isAdmin={isAdmin} />;
}
