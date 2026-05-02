import { createClient } from '@/lib/supabase/server';
import BriefGenerator from '@/components/BriefGenerator';

export default async function Home() {
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

  return <BriefGenerator user={userInfo} />;
}