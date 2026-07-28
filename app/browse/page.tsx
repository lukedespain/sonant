import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();

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
    .limit(200)
    .returns<BriefRow[]>();

  const { data: myBriefs } = user
    ? await supabase
        .from('briefs')
        .select('id, user_id, mode, target, genres, moods, generated_content, created_at, featured_track_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<BriefRow[]>()
    : { data: null };

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Briefs
        </div>

        <div className="flex items-end justify-between gap-6 mb-4 flex-wrap">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            Read the brief. <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>Win the slot.</span>
          </h1>
          <a
            href="https://sonant.disco.ac/cat/152887908"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Full Music Catalog
          </a>
        </div>

        <p className="text-sm text-[var(--text-tertiary)] mb-10 max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Each round has three Sonant briefs — one Brand, one Film, one Game. Submit your track. The strongest placement goes into the catalog and gets pitched to real buyers.
        </p>

        <BrowseClient
          featuredBriefs={featuredBriefs ?? []}
          communityBriefs={communityBriefs ?? []}
          myBriefs={myBriefs ?? []}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
