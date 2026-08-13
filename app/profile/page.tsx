import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProfileIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/profile');
  redirect(`/profile/${user.id}`);
}
