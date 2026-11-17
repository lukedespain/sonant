import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/admin';
import { readHandoffs } from '@/lib/handoff';
import { composerHasClientAccess } from '@/lib/verification';
import { loadCatalogueBriefs, loadClientBriefs } from '@/lib/tc-briefs';
import { AppHeader, AppPage, SectionHeader, btn } from '@/components/ui';
import BriefGrid, { type BriefCard } from '@/components/BriefGrid';
import { IconLock, IconPlus } from '@/components/shell/icons';

export default async function BriefsPage() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = isSiteAdmin(user);

  // Client brief rows are only ever sent to composers who can open them.
  const canSeeClient = user ? await composerHasClientAccess(admin, user.id, isAdmin) : false;
  const [catalogue, client, mine] = await Promise.all([
    loadCatalogueBriefs(admin),
    canSeeClient ? loadClientBriefs(admin) : Promise.resolve([]),
    user
      ? admin
          .from('submissions')
          .select('id, brief_id, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  // Latest submission per brief, so each card can say where you stand.
  const handoffs = readHandoffs(user?.app_metadata);
  const byBrief = new Map<string, BriefCard['submission']>();
  for (const row of (mine.data ?? []) as { id: string; brief_id: string; status: string }[]) {
    if (byBrief.has(row.brief_id)) continue;
    byBrief.set(row.brief_id, {
      status: row.status,
      needsSignature: row.status === 'accepted' && !!handoffs[row.id] && !handoffs[row.id].agreedAt,
    });
  }
  const withStatus = (list: BriefCard[]) => list.map((b) => ({ ...b, submission: byBrief.get(b.id) ?? null }));

  return (
    <AppPage>
      <AppHeader
        title="Briefs"
        description="What our clients keep asking for. Write to a brief, submit your track, and the strongest go into the Thought Collective catalogue."
        actions={
          isAdmin ? (
            <Link href="/admin?tab=briefs&kind=catalog" className={btn('secondary', 'md')}>
              <IconPlus size={14} /> New brief
            </Link>
          ) : !user ? (
            <Link href="/signup" className={btn('primary', 'md')}>
              Create an account
            </Link>
          ) : null
        }
      />

      {client.length > 0 && (
        <section className="mb-14">
          <SectionHeader
            title="Client briefs"
            count={client.filter((b) => !b.closed).length}
            description={
              <span className="inline-flex items-center gap-1.5">
                <IconLock size={12} /> Paid, confidential jobs for our roster. Please don&apos;t share these.
              </span>
            }
          />
          <BriefGrid briefs={withStatus(client)} showTabs={false} />
        </section>
      )}

      <section>
        {client.length > 0 && <SectionHeader title="Catalogue briefs" count={catalogue.length} />}
        <BriefGrid briefs={withStatus(catalogue)} feature />
      </section>
    </AppPage>
  );
}
