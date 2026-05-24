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
        <div className="no-print mb-6 space-y-3">
          {/* Row 1: Back to Library | Submit a Track */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/library"
              className="text-xs tracking-[0.2em] uppercase text-[#8A8680] hover:text-[#F5F1E8] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ← Back to Library
            </Link>
            <SubmitTrackModal
              briefId={briefRow.id}
              projectName={brief.codename}
              alreadySubmitted={alreadySubmitted}
            />
          </div>

          {/* Row 2: Export PDF | Delete */}
          <div className="flex items-center justify-between gap-3">
            <ExportPdfButton />
            <DeleteBriefButton briefId={briefRow.id} />
          </div>

          {/* Tip */}
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#8A8680] text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Tip: when exporting, set destination to &ldquo;Save as PDF&rdquo;
          </p>
        </div>

        <BriefDocument brief={brief} />
      </div>
    </div>
  );
}