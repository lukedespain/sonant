import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSubmissionCard from '@/components/AdminSubmissionCard';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_USER_ID) {
    redirect('/');
  }

  const admin = createAdminClient();

  // All submissions, newest first.
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, brief_id, user_id, status, feedback, created_at')
    .order('created_at', { ascending: false });

  // Resolve brief names and composer emails for each submission.
  const rows = [];
  for (const sub of submissions ?? []) {
    const { data: brief } = await admin
      .from('briefs')
      .select('generated_content')
      .eq('id', sub.brief_id)
      .single();

    const { data: composer } = await admin.auth.admin.getUserById(sub.user_id);

    rows.push({
      id: sub.id,
      projectName:
        (brief?.generated_content as { codename?: string })?.codename ??
        'Untitled',
      composerEmail: composer?.user?.email ?? 'unknown',
      status: sub.status,
      feedback: sub.feedback,
      submittedAt: new Date(sub.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });
  }

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Admin
        </div>

        <h1
          className="text-5xl md:text-6xl tracking-tight leading-tight mb-3"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Submission <span className="italic">review</span>.
        </h1>

        <p
          className="text-base text-[#A8A39A] mb-12 max-w-xl"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Every track submitted to the catalog. Record a decision with written
          feedback. The composer is emailed when you do.
        </p>

        {rows.length === 0 ? (
          <div
            className="border border-[#2A2826] bg-[#141312] p-12 text-center"
            style={{ borderRadius: '2px' }}
          >
            <p
              className="text-sm text-[#8A8680]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              No submissions yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((row) => (
              <AdminSubmissionCard
                key={row.id}
                submissionId={row.id}
                projectName={row.projectName}
                composerEmail={row.composerEmail}
                status={row.status}
                existingFeedback={row.feedback}
                submittedAt={row.submittedAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}