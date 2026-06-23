import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import SunoPromptModal from '@/components/SunoPromptModal';
import { getSubmissionStatus } from '@/app/briefs/actions';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BrowseBriefPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use admin client so any logged-in user can view any brief.
  const admin = createAdminClient();
  const { data: briefRow, error } = await admin
    .from('briefs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !briefRow) {
    notFound();
  }

  const brief = briefRow.generated_content as Brief;
  const submission = await getSubmissionStatus(briefRow.id);
  const alreadySubmitted = submission !== null;
  const isAdmin = user.id === ADMIN_USER_ID;

  return (
    <div className="pt-20 pb-12 flex-1 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="no-print mb-6 space-y-3">
          {/* Row 1: Back | Submit */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/browse"
              className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ← Browse Briefs
            </Link>
            <SubmitTrackModal
              briefId={briefRow.id}
              projectName={brief.codename}
              alreadySubmitted={alreadySubmitted}
            />
          </div>

          {/* Row 2: Export (+ AI Prompt for admin) */}
          <div className="flex items-center gap-3">
            <ExportPdfButton />
            {isAdmin && <SunoPromptModal brief={brief} />}
          </div>

          {/* Tip */}
          <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-muted)] text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Tip: when exporting, set destination to &ldquo;Save as PDF&rdquo;
          </p>
        </div>

        <BriefDocument brief={brief} />
      </div>
    </div>
  );
}
