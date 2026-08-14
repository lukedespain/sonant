import { createAdminClient } from '@/lib/supabase/admin';
import AdminSubmissionCard from '@/components/AdminSubmissionCard';

export default async function SubmissionsTab() {
  const admin = createAdminClient();
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, brief_id, user_id, status, feedback, created_at')
    .order('created_at', { ascending: false });

  const rows = submissions ?? [];
  const userIds = [...new Set(rows.map((s) => s.user_id as string))];
  const briefIds = [...new Set(rows.map((s) => s.brief_id as string))];

  const [{ data: profiles }, { data: briefs }] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    briefIds.length
      ? admin.from('briefs').select('id, generated_content').in('id', briefIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [
      p.id,
      { name: p.full_name ?? '', email: p.email ?? 'unknown' },
    ])
  );
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b: { id: string; generated_content: { codename?: string } | null }) => [
      b.id,
      (b.generated_content as { codename?: string } | null)?.codename ?? 'Untitled',
    ])
  );

  const cards = rows.map((sub) => ({
    id: sub.id as string,
    briefId: sub.brief_id as string,
    projectName: briefMap[sub.brief_id as string] ?? 'Untitled',
    composerEmail: profileMap[sub.user_id as string]?.email ?? 'unknown',
    composerName: profileMap[sub.user_id as string]?.name ?? '',
    status: sub.status as string,
    feedback: (sub.feedback as string | null) ?? null,
    submittedAt: new Date(sub.created_at as string).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));

  const ordered = [
    ...cards.filter((row) => row.status !== 'accepted' && row.status !== 'not_accepted'),
    ...cards.filter((row) => row.status === 'accepted' || row.status === 'not_accepted'),
  ];

  if (ordered.length === 0) {
    return (
      <div
        className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center"
        style={{ borderRadius: '2px' }}
      >
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          No submissions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((row) => (
        <AdminSubmissionCard
          key={row.id}
          submissionId={row.id}
          briefId={row.briefId}
          projectName={row.projectName}
          composerEmail={row.composerName ? `${row.composerName} · ${row.composerEmail}` : row.composerEmail}
          status={row.status}
          existingFeedback={row.feedback}
          submittedAt={row.submittedAt}
        />
      ))}
    </div>
  );
}
