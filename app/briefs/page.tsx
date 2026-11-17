import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminView } from '@/lib/admin-view';
import { readHandoffs } from '@/lib/handoff';
import { loadCatalogueBriefs } from '@/lib/tc-briefs';
import { AppHeader, AppPage, btn } from '@/components/ui';
import BriefGrid, { type BriefCard } from '@/components/BriefGrid';
import { IconPlus } from '@/components/shell/icons';

export default async function BriefsPage() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await isAdminView(user);

  const [catalogue, mine] = await Promise.all([
    loadCatalogueBriefs(admin),
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
        description="The tracks our clients keep asking for. Write to one and submit it. Accepted tracks go into the Thought Collective catalogue, and you join our roster."
        actions={
          isAdmin ? (
            <Link href="/admin?tab=briefs" className={btn('secondary', 'md')}>
              <IconPlus size={14} /> Create brief
            </Link>
          ) : !user ? (
            <Link href="/signup" className={btn('primary', 'md')}>
              Create an account
            </Link>
          ) : null
        }
      />

      <BriefGrid briefs={withStatus(catalogue)} feature filters admin={isAdmin} />
    </AppPage>
  );
}
