import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BriefImporter from '@/components/BriefImporter';

interface BriefRow {
  id: string;
  mode: string;
  target: string;
  genres: string[];
  moods: string[];
  generated_content: {
    codename?: string;
    project?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

function getStatusConfig(status: string) {
  if (status === 'accepted') return {
    cardClass: 'bg-[var(--status-accepted-bg)] border-[var(--status-accepted-border)]',
    label: 'Accepted',
    color: '#7A9A6E',
  };
  if (status === 'not_accepted') return {
    cardClass: 'bg-[var(--status-reviewed-bg)] border-[var(--status-reviewed-border)]',
    label: 'Reviewed',
    color: 'var(--text-muted)',
  };
  return {
    cardClass: 'bg-[var(--status-pending-bg)] border-[var(--status-pending-border)]',
    label: 'Pending Review',
    color: '#E8A33D',
  };
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all submissions for this user, ordered by submission date
  const { data: submissions } = await supabase
    .from('submissions')
    .select('brief_id, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Map brief_id → most recent submission status (first occurrence = most recent)
  const submissionStatusByBrief = new Map<string, string>();
  for (const sub of submissions ?? []) {
    if (!submissionStatusByBrief.has(sub.brief_id)) {
      submissionStatusByBrief.set(sub.brief_id, sub.status);
    }
  }

  // Fetch only the briefs that have been submitted to
  const submittedBriefIds = Array.from(submissionStatusByBrief.keys());
  let submittedBriefs: BriefRow[] = [];

  if (submittedBriefIds.length > 0) {
    const { data } = await supabase
      .from('briefs')
      .select('id, mode, target, genres, moods, generated_content, created_at')
      .in('id', submittedBriefIds)
      .returns<BriefRow[]>();

    // Sort by submission date order (submittedBriefIds is already newest-first)
    const byId = new Map((data ?? []).map(b => [b.id, b]));
    submittedBriefs = submittedBriefIds.map(id => byId.get(id)).filter(Boolean) as BriefRow[];
  }

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <BriefImporter />

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Submissions
        </div>

        <div className="flex items-end justify-between gap-6 mb-3 flex-wrap">
          <h1 className="text-5xl md:text-6xl tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            My <span className="italic">submissions</span>.
          </h1>
          <Link
            href="/browse"
            className="text-xs tracking-[0.2em] uppercase px-5 py-3 bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Browse Briefs
          </Link>
        </div>

        <p className="text-base text-[var(--text-tertiary)] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Every brief you&apos;ve submitted a track to, and where it stands.
        </p>

        {submittedBriefs.length === 0 ? (
          <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center" style={{ borderRadius: '2px' }}>
            <div className="text-3xl text-[var(--text-dimmer)] mb-4">◇</div>
            <h2 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              No submissions yet.
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Browse the brief catalog, write to one, and submit your track.
            </p>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Browse Briefs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submittedBriefs.map((brief) => {
              const status = submissionStatusByBrief.get(brief.id) ?? 'pending';
              const { cardClass, label, color } = getStatusConfig(status);
              return (
                <Link
                  key={brief.id}
                  href={`/library/${brief.id}`}
                  className={`block p-6 border transition-colors group hover:border-[#E85D2F] ${cardClass}`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                      className="text-2xl leading-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                    >
                      Project <span className="italic">{brief.generated_content?.codename || 'Untitled'}</span>
                    </h3>
                    <span
                      className="text-[10px] tracking-wider text-[var(--text-dimmer)] shrink-0 mt-1.5"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {new Date(brief.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div
                    className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {brief.mode === 'brand' ? 'Brand' : brief.mode === 'film' ? 'Film' : 'Games'} · {brief.target}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {[...brief.genres.slice(0, 3), ...brief.moods.slice(0, 3)].map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className="text-[10px] tracking-wider px-2 py-1 bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border-card)]"
                        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span
                      className="text-[10px] tracking-[0.2em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color }}
                    >
                      {label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
