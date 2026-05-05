import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import { deleteBrief } from '@/app/briefs/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BriefDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: briefRow, error } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !briefRow) {
    notFound();
  }

  const brief = briefRow.generated_content as Brief;
  const savedDate = new Date(briefRow.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{
        background: '#0A0908',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        color: '#F5F1E8',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: '#E85D2F', color: '#0A0908', fontFamily: "'Fraunces', serif", fontWeight: 600, borderRadius: '2px' }}
            >
              ◆
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
              Sonant<span className="text-[#E85D2F]">.</span>
            </span>
          </Link>
          <Link
            href="/library"
            className="text-xs tracking-[0.2em] uppercase text-[#8A8680] hover:text-[#F5F1E8] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ← Back to Library
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div
            className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ◆ Saved {savedDate} · {brief.briefId}
          </div>
          <form action={deleteBrief}>
            <input type="hidden" name="briefId" value={briefRow.id} />
            <button
              type="submit"
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] text-[#8A8680] hover:border-[#FF8B6B] hover:text-[#FF8B6B] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Delete
            </button>
          </form>
        </div>

        <BriefDocument brief={brief} />
      </div>
    </div>
  );
}