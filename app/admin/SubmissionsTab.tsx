import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSubmissionCard from '@/components/AdminSubmissionCard';

type Queue = 'catalog' | 'client';

type BriefContent = {
  codename?: string;
  projectTitle?: string;
  kind?: string;
} | null;

function isClientBrief(briefType: string | null | undefined, content: BriefContent) {
  return briefType === 'client' || content?.kind === 'client';
}

function projectName(content: BriefContent, isClient: boolean) {
  if (isClient && content?.projectTitle) return content.projectTitle;
  return content?.codename ?? 'Untitled';
}

export default async function SubmissionsTab({ queue = 'catalog' }: { queue?: Queue }) {
  const admin = createAdminClient();
  type SubmissionRow = {
    id: string;
    brief_id: string;
    user_id: string;
    status: string;
    feedback: string | null;
    created_at: string;
    delivery?: string | null;
    disco_inbox_url?: string | null;
    delivery_confirmed_at?: string | null;
  };
  const full = await admin
    .from('submissions')
    .select('id, brief_id, user_id, status, feedback, created_at, delivery, disco_inbox_url, delivery_confirmed_at')
    .order('created_at', { ascending: false });
  const fallback = full.error
    ? await admin
        .from('submissions')
        .select('id, brief_id, user_id, status, feedback, created_at')
        .order('created_at', { ascending: false })
    : null;
  const rows = ((full.error ? fallback?.data : full.data) ?? []) as SubmissionRow[];
  const userIds = [...new Set(rows.map((s) => s.user_id))];
  const briefIds = [...new Set(rows.map((s) => s.brief_id))];

  const [{ data: profiles }, { data: briefs }] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    briefIds.length
      ? admin.from('briefs').select('id, brief_type, generated_content').in('id', briefIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [
      p.id,
      { name: p.full_name ?? '', email: p.email ?? 'unknown' },
    ])
  );
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b: { id: string; brief_type?: string | null; generated_content: BriefContent }) => {
      const content = b.generated_content;
      const client = isClientBrief(b.brief_type, content);
      return [
        b.id,
        {
          isClient: client,
          name: projectName(content, client),
        },
      ];
    })
  );

  const cards = rows.map((sub) => {
    const brief = briefMap[sub.brief_id] ?? { isClient: false, name: 'Untitled' };
    const delivery: 'upload' | 'disco' = sub.delivery === 'disco' ? 'disco' : 'upload';
    return {
      id: sub.id,
      briefId: sub.brief_id,
      projectName: brief.name,
      isClient: brief.isClient,
      composerEmail: profileMap[sub.user_id]?.email ?? 'unknown',
      composerName: profileMap[sub.user_id]?.name ?? '',
      status: sub.status,
      feedback: sub.feedback ?? null,
      submittedAt: new Date(sub.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      delivery,
      discoInboxUrl: sub.disco_inbox_url ?? null,
      deliveryConfirmedAt: sub.delivery_confirmed_at ?? null,
    };
  });

  const catalogCards = cards.filter((row) => !row.isClient);
  const clientCards = cards.filter((row) => row.isClient);
  const visible = queue === 'client' ? clientCards : catalogCards;

  const ordered = [
    ...visible.filter((row) =>
      row.delivery === 'disco' ? !row.deliveryConfirmedAt : row.status !== 'accepted' && row.status !== 'not_accepted'
    ),
    ...visible.filter((row) =>
      row.delivery === 'disco' ? !!row.deliveryConfirmedAt : row.status === 'accepted' || row.status === 'not_accepted'
    ),
  ];

  const catalogPending = catalogCards.filter(
    (row) => row.status !== 'accepted' && row.status !== 'not_accepted'
  ).length;
  const clientPending = clientCards.filter((row) =>
    row.delivery === 'disco' ? !row.deliveryConfirmedAt : row.status !== 'accepted' && row.status !== 'not_accepted'
  ).length;

  return (
    <div>
      <div className="flex items-end mb-8 border-b border-[var(--border-base)]">
        <QueueLink
          href="/admin"
          label="Catalog"
          pending={catalogPending}
          active={queue === 'catalog'}
        />
        <QueueLink
          href="/admin?queue=client"
          label="Client"
          pending={clientPending}
          active={queue === 'client'}
        />
      </div>

      {ordered.length === 0 ? (
        <div
          className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center"
          style={{ borderRadius: '2px' }}
        >
          <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {queue === 'client' ? 'No client submissions yet.' : 'No catalog submissions yet.'}
          </p>
        </div>
      ) : (
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
              briefType={row.isClient ? 'client' : 'catalog'}
              delivery={row.delivery}
              discoInboxUrl={row.discoInboxUrl}
              deliveryConfirmedAt={row.deliveryConfirmedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueLink({
  href,
  label,
  pending,
  active,
}: {
  href: string;
  label: string;
  pending: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 ${
        active
          ? 'text-[var(--text-primary)] border-[#E85D2F]'
          : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {label}
      {pending > 0 && (
        <span className="ml-2 text-[#E85D2F] tracking-[0.12em]">{pending}</span>
      )}
    </Link>
  );
}