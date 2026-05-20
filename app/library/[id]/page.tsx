import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
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
 

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 no-print">
          <Link
            href="/library"
            className="text-xs tracking-[0.2em] uppercase text-[#8A8680] hover:text-[#F5F1E8] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ← Back to Library
          </Link>
          <div className="flex items-center gap-3">
            <ExportPdfButton />
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
        </div>

        <p className="text-[10px] tracking-[0.15em] uppercase text-[#8A8680] mb-6 text-right no-print" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Tip: when exporting, set destination to &ldquo;Save as PDF&rdquo;
        </p>

        <BriefDocument brief={brief} />
      </div>
    </div>
  );
}