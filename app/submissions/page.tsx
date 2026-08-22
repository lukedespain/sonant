import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubmissionHistory from '@/components/SubmissionHistory';
import type { SubmissionItem } from '@/components/SubmissionHistory';

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let submissions: SubmissionItem[] = [];

  if (user) {
    const admin = createAdminClient();
    const { data: rawSubmissions } = await admin
      .from('submissions')
      .select('id, brief_id, status, feedback, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const briefIds = [...new Set((rawSubmissions ?? []).map((s) => s.brief_id as string))];
    const { data: briefs } = briefIds.length
      ? await admin.from('briefs').select('id, generated_content, brief_type').in('id', briefIds)
      : { data: [] };

    const briefMap = Object.fromEntries(
      (briefs ?? []).map((b) => [
        b.id,
        {
          codename: (b.generated_content as { codename?: string })?.codename ?? 'Untitled',
          briefType: (b as { brief_type?: string }).brief_type ?? 'catalog',
        },
      ])
    );

    submissions = (rawSubmissions ?? []).map((s) => ({
      id: s.id as string,
      briefId: s.brief_id as string,
      briefCodename: briefMap[s.brief_id as string]?.codename ?? 'Untitled',
      trackName: (s as { file_name?: string | null }).file_name ?? null,
      briefType: briefMap[s.brief_id as string]?.briefType ?? 'catalog',
      status: s.status as string,
      feedback: s.feedback as string | null,
      createdAt: s.created_at as string,
    }));
  }

  return (
    <div className="flex-1">
      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <h1
          className="tracking-tight leading-[0.95] mb-8 max-w-2xl"
          style={{
            ...serif,
            fontWeight: 300,
            fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
          }}
        >
          Submissions.
        </h1>
        <p
          className="text-base text-[var(--text-muted)] leading-relaxed max-w-xl"
          style={sans}
        >
          We don&apos;t take random tracks. Every submission is tied to a catalog brief, so the notes you get are precise, not subjective, and so the catalog gets what it&apos;s actually looking for.
        </p>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                n: '01',
                title: 'Pick a brief',
                body: 'Browse Sonant briefs and community briefs, or generate one that fits a track you already have.',
              },
              {
                n: '02',
                title: 'Submit to that brief',
                body: 'One credit. The track has to be written to the brief. That is the whole point of the catalog.',
              },
              {
                n: '03',
                title: 'Get written feedback.',
                body: 'Every submission gets written feedback. If it is strong enough, it goes in the catalog and we pitch it.',
              },
            ].map((step) => (
              <div key={step.n} className="border-t border-[var(--border-base)] pt-4">
                <div
                  className="text-lg leading-none text-[var(--text-dimmer)] mb-2"
                  style={{ ...serif, fontWeight: 300 }}
                >
                  {step.n}
                </div>
                <h2
                  className="text-base mb-2 text-[var(--text-primary)]"
                  style={{ ...serif, fontWeight: 400 }}
                >
                  {step.title}
                </h2>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed" style={sans}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-base)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <h2
            className="text-3xl md:text-4xl tracking-tight mb-10"
            style={{ ...serif, fontWeight: 300 }}
          >
            Your <span className="italic">history.</span>
          </h2>

          {user ? (
            <SubmissionHistory items={submissions} />
          ) : (
            <div
              className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
              style={{ borderRadius: '2px' }}
            >
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
                Sign in to see the tracks you&apos;ve submitted, their status, and any written feedback.
              </p>
              <Link
                href="/login?redirect=/submissions"
                className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
              >
                ◆ Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
