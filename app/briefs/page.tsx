import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/admin';
import { composerHasClientAccess } from '@/lib/verification';
import { loadCatalogueBriefs, loadClientBriefs } from '@/lib/tc-briefs';
import { Page, PageHeader, btn } from '@/components/ui';
import BriefGrid from '@/components/BriefGrid';

export default async function BriefsPage() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = isSiteAdmin(user);

  // Client brief rows are only ever sent to composers who can open them.
  const canSeeClient = user ? await composerHasClientAccess(admin, user.id, isAdmin) : false;
  const [catalogue, client] = await Promise.all([
    loadCatalogueBriefs(admin),
    canSeeClient ? loadClientBriefs(admin) : Promise.resolve([]),
  ]);

  return (
    <Page>
      <PageHeader
        title="Briefs"
        description="What our clients keep asking for. Write to a brief, submit your track, and the strongest go into the Thought Collective catalogue."
        actions={
          isAdmin ? (
            <Link href="/admin?tab=briefs&kind=catalog" className={btn('secondary', 'sm')}>
              + New brief
            </Link>
          ) : !user ? (
            <Link href="/signup" className={btn('primary', 'md')}>
              Create an account
            </Link>
          ) : null
        }
      />

      {client.length > 0 && (
        <section className="mb-24">
          <h2 className="text-[28px] md:text-[34px] font-medium tracking-[-0.03em] mb-2">Client briefs</h2>
          <p className="text-[15px] text-[var(--text-muted)] mb-10 max-w-xl">
            Paid, confidential jobs for our roster. Please don&apos;t share these.
          </p>
          <BriefGrid briefs={client} showTabs={false} />
        </section>
      )}

      <section>
        {client.length > 0 && (
          <h2 className="text-[28px] md:text-[34px] font-medium tracking-[-0.03em] mb-10">Catalogue briefs</h2>
        )}
        <BriefGrid briefs={catalogue} />
      </section>
    </Page>
  );
}
