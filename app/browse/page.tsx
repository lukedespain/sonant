import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import BrowseClient from './BrowseClient';

interface BriefRow {
  id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: {
    codename?: string;
    project?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Fetch all briefs for the "All Briefs" tab
  const { data: allBriefs } = await admin
    .from('briefs')
    .select('id, mode, target, genres, moods, generated_content, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<BriefRow[]>();

  // Fetch only the current user's briefs for "My Briefs" tab
  const { data: myBriefs } = await admin
    .from('briefs')
    .select('id, mode, target, genres, moods, generated_content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<BriefRow[]>();

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Briefs
        </div>

        <div className="flex items-end justify-between gap-6 mb-3 flex-wrap">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            Your <span className="italic">briefs</span>.
          </h1>
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Generate New Brief
          </Link>
        </div>

        <p className="text-base text-[var(--text-tertiary)] mb-10 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Browse every brief generated on Sonant, or filter down to your own.
        </p>

        <BrowseClient allBriefs={allBriefs ?? []} myBriefs={myBriefs ?? []} />
      </div>
    </div>
  );
}
