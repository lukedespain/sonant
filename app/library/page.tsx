import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefImporter from '@/components/BriefImporter';

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

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: briefs } = await supabase
    .from('briefs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<BriefRow[]>();

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <BriefImporter />
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Your Library
        </div>

        <div className="flex items-end justify-between gap-6 mb-3 flex-wrap">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            Saved <span className="italic">briefs</span>.
          </h1>
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ New Brief
          </Link>
        </div>

        <p className="text-base text-[#A8A39A] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Every brief you&apos;ve saved, ready to revisit, write to, or build a track against.
        </p>

        {!briefs || briefs.length === 0 ? (
          <div className="border border-[#2A2826] bg-[#141312] p-12 text-center" style={{ borderRadius: '2px' }}>
            <div className="text-3xl text-[#5A5650] mb-4">◇</div>
            <h2 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              Your library is empty.
            </h2>
            <p className="text-sm text-[#8A8680] mb-6 max-w-md mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Generate a brief on the homepage, hit Save, and it&apos;ll appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Generate a Brief
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefs.map((brief) => (
              <Link
                key={brief.id}
                href={`/library/${brief.id}`}
                className="block p-6 border border-[#2A2826] bg-[#141312] hover:border-[#E85D2F] hover:bg-[#181614] transition-colors group"
                style={{ borderRadius: '2px' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {brief.mode === 'brand' ? 'Brand' : brief.mode === 'film' ? 'Film' : 'Games'} · {brief.target}
                  </div>
                  <span className="text-[10px] tracking-wider text-[#5A5650]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h3
                  className="text-2xl mb-3 leading-tight text-[#F5F1E8] group-hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  Project <span className="italic">{brief.generated_content?.codename || 'Untitled'}</span>
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-1">
                  {brief.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="text-[10px] tracking-wider px-2 py-1 bg-[#0A0908] text-[#A8A39A] border border-[#2A2826]"
                      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {brief.moods.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="text-[10px] tracking-wider text-[#E85D2F]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}