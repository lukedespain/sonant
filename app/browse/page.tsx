import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import BrowseClient from './BrowseClient';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

interface BriefRow {
  id: string;
  user_id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: {
    codename?: string;
    project?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
  created_at: string;
  featured_track_url?: string | null;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;

  const { data: featuredBriefs } = await admin
    .from('briefs')
    .select('id, user_id, mode, target, genres, moods, generated_content, created_at, featured_track_url')
    .eq('user_id', ADMIN_USER_ID)
    .order('created_at', { ascending: false })
    .returns<BriefRow[]>();

  const { data: communityBriefs } = await admin
    .from('briefs')
    .select('id, user_id, mode, target, genres, moods, generated_content, created_at, featured_track_url')
    .neq('user_id', ADMIN_USER_ID)
    .order('created_at', { ascending: false })
    .limit(80)
    .returns<BriefRow[]>();

  return (
    <div className="pt-16 md:pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <BrowseClient
          featuredBriefs={featuredBriefs ?? []}
          communityBriefs={communityBriefs ?? []}
          currentUserId={user?.id ?? null}
          mineOnlyDefault={params.mine === '1'}
        />
      </div>
    </div>
  );
}
