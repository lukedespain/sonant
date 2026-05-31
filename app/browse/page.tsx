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
  const { data: briefs } = await admin
    .from('briefs')
    .select('id, mode, target, genres, moods, generated_content, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<BriefRow[]>();

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Brief Catalog
        </div>

        <div className="flex items-end justify-between gap-6 mb-3 flex-wrap">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            Browse <span className="italic">all briefs</span>.
          </h1>
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Generate New Brief
          </Link>
        </div>

        <p className="text-base text-[#A8A39A] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Every brief generated on Sonant. Find one that matches what you want to write, or generate your own.
        </p>

        <BrowseClient briefs={briefs ?? []} />
      </div>
    </div>
  );
}
