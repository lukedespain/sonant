import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import DeleteBriefButton from './DeleteBriefButton';
import { getSubmissionStatus } from '@/app/briefs/actions';

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
  const submission = await getSubmissionStatus(briefRow.id);
  const alreadySubmitted = submission !== null;
 

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
            <SubmitTrackModal
              briefId={briefRow.id}
              projectName={brief.codename}
              alreadySubmitted={alreadySubmitted}
            />
            <ExportPdfButton />
            <DeleteBriefButton briefId={briefRow.id} />
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