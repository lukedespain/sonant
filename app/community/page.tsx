import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

interface ComposerRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  submissions: number;
  uploads: number;
  featured: number;
  generations: number;
  score: number;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  '#E85D2F', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009473', '#DD4132', '#45B5AA',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif" }}>
      01
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 flex items-center justify-center text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'Fraunces', serif" }}>
      02
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 flex items-center justify-center text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'Fraunces', serif" }}>
      03
    </div>
  );
  return (
    <div className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-dimmer)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {String(rank).padStart(2, '0')}
    </div>
  );
}

export default async function CommunityPage() {
  const admin = createAdminClient();

  // Fetch all submissions (exclude admin)
  const { data: allSubmissions } = await admin
    .from('submissions')
    .select('user_id')
    .neq('user_id', ADMIN_USER_ID);

  // Fetch all community tracks (exclude admin)
  const { data: allTracks } = await admin
    .from('community_tracks')
    .select('id, user_id')
    .neq('user_id', ADMIN_USER_ID);

  // Fetch briefs that have a featured track to determine featured counts
  const { data: featuredBriefs } = await admin
    .from('briefs')
    .select('featured_track_id')
    .not('featured_track_id', 'is', null);

  // Fetch user-generated briefs (generations) — exclude admin-owned Sonant briefs
  const { data: allGeneratedBriefs } = await admin
    .from('briefs')
    .select('user_id')
    .neq('user_id', ADMIN_USER_ID);

  const featuredTrackIds = new Set((featuredBriefs ?? []).map((b) => b.featured_track_id as string));

  // Count per user
  const submissionsCount: Record<string, number> = {};
  (allSubmissions ?? []).forEach((s) => {
    submissionsCount[s.user_id] = (submissionsCount[s.user_id] ?? 0) + 1;
  });

  const uploadsCount: Record<string, number> = {};
  const featuredCount: Record<string, number> = {};
  (allTracks ?? []).forEach((t) => {
    uploadsCount[t.user_id] = (uploadsCount[t.user_id] ?? 0) + 1;
    if (featuredTrackIds.has(t.id)) {
      featuredCount[t.user_id] = (featuredCount[t.user_id] ?? 0) + 1;
    }
  });

  const generationsCount: Record<string, number> = {};
  (allGeneratedBriefs ?? []).forEach((b) => {
    generationsCount[b.user_id] = (generationsCount[b.user_id] ?? 0) + 1;
  });

  // All unique user ids across all activity lists
  const allUserIds = [...new Set([
    ...Object.keys(submissionsCount),
    ...Object.keys(uploadsCount),
    ...Object.keys(generationsCount),
  ])];

  if (allUserIds.length === 0) {
    return <EmptyState />;
  }

  // Fetch profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', allUserIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; full_name: string; avatar_url?: string | null }) => [p.id, { name: p.full_name, avatarUrl: p.avatar_url ?? null }])
  );

  // Score: submissions × 3 + featured × 2 + uploads × 1 + generations × 0 (participation only)
  const composers: ComposerRow[] = allUserIds.map((id) => ({
    id,
    name: profileMap[id]?.name ?? 'Anonymous',
    avatarUrl: profileMap[id]?.avatarUrl ?? null,
    submissions: submissionsCount[id] ?? 0,
    uploads: uploadsCount[id] ?? 0,
    featured: featuredCount[id] ?? 0,
    generations: generationsCount[id] ?? 0,
    score: (submissionsCount[id] ?? 0) * 3 + (featuredCount[id] ?? 0) * 2 + (uploadsCount[id] ?? 0),
  }));

  composers.sort((a, b) => b.score - a.score || b.submissions - a.submissions || b.featured - a.featured);

  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="mb-16">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Community
          </div>
          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            The <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>leaderboard.</span>
          </h1>
          <p className="text-base text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Ranked by competition submissions, featured tracks, and community uploads. Updated in real time.
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-6 pb-4 border-b border-[var(--border-base)]">
          {[
            { label: 'Submissions', desc: 'Sonant brief entries' },
            { label: 'Featured', desc: 'Community tracks selected as featured' },
            { label: 'Uploads', desc: 'Community brief tracks' },
            { label: 'Generations', desc: 'Briefs generated' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }} title={desc}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Leaderboard rows */}
        <div className="space-y-0">
          {composers.map((composer, i) => {
            const rank = i + 1;
            const color = avatarColor(composer.id);
            const isTop3 = rank <= 3;
            return (
              <div
                key={composer.id}
                className={`flex items-center gap-5 py-5 border-b border-[var(--border-base)] transition-colors ${
                  isTop3 ? 'hover:bg-[var(--bg-card)]' : 'hover:bg-[var(--bg-card)]'
                } -mx-4 px-4`}
                style={{ borderRadius: '2px' }}
              >
                {/* Rank */}
                <RankBadge rank={rank} />

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ background: composer.avatarUrl ? undefined : color, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {composer.avatarUrl
                    ? <img src={composer.avatarUrl} alt={composer.name} className="w-full h-full object-cover" />
                    : initials(composer.name)
                  }
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-base truncate block ${isTop3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                    style={{ fontFamily: "'Fraunces', serif", fontWeight: isTop3 ? 400 : 300 }}
                  >
                    {composer.name}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 shrink-0">
                  <Stat label="Submissions" value={composer.submissions} highlight={composer.submissions > 0} />
                  <Stat label="Featured" value={composer.featured} highlight={composer.featured > 0} />
                  <Stat label="Uploads" value={composer.uploads} highlight={composer.uploads > 0} />
                  <Stat label="Generations" value={composer.generations} highlight={false} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 border border-[var(--border-card)] bg-[var(--bg-card)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderRadius: '2px' }}>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Get on the board
            </div>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Submit to a Sonant brief or upload a track to a community brief to start building your rank.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Link
              href="/browse"
              className="px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ View Briefs
            </Link>
            <Link
              href="/generator"
              className="px-5 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Generate a Brief
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  return (
    <div className="text-center min-w-[60px]">
      <div
        className={`text-xl tabular-nums ${highlight ? 'text-[#E85D2F]' : 'text-[var(--text-dimmer)]'}`}
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
      >
        {value}
      </div>
      <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Community
        </div>
        <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          The <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>leaderboard.</span>
        </h1>
        <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-16 text-center mt-12" style={{ borderRadius: '2px' }}>
          <div className="text-4xl text-[var(--text-dimmer)] mb-6">◇</div>
          <p className="text-lg text-[var(--text-secondary)] mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            No entries yet.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Be the first composer on the board.
          </p>
          <Link
            href="/browse"
            className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ View Briefs
          </Link>
        </div>
      </div>
    </div>
  );
}
