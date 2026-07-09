import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import ExportPdfButton from '@/components/ExportPdfButton';
import DeleteBriefButton from '@/components/DeleteBriefButton';
import SunoPromptModal from '@/components/SunoPromptModal';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

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
  const isAdmin = user.id === ADMIN_USER_ID;

  return (
    <div className="pt-20 pb-12 flex-1 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="no-print mb-6 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/library"
            className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ← My Submissions
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && <SunoPromptModal brief={brief} />}
            <ExportPdfButton />
            <DeleteBriefButton briefId={briefRow.id} redirectPath="/library" />
          </div>
        </div>

        <BriefDocument brief={brief} />
      </div>
    </div>
  );
}
