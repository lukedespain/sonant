import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

type BookingRow = {
  id: string;
  user_id: string;
  brief_id: string | null;
  track_id: string | null;
  duration_minutes: number | null;
  cal_booking_id: string | null;
  scheduled_at: string;
  status: string;
  notes: string | null;
  recording_url: string | null;
};

type ProfileRow = { id: string; full_name: string | null; email: string | null };
type BriefRow = { id: string; generated_content: { codename?: string; project?: string } | null };
type TrackRow = { id: string; file_name: string | null; file_url: string | null; user_id: string; brief_id: string };

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SessionCard({
  booking,
  composer,
  briefName,
  track,
}: {
  booking: BookingRow;
  composer: ProfileRow | undefined;
  briefName: string;
  track: TrackRow | null;
}) {
  const name = composer?.full_name?.trim() || 'Composer';
  const email = composer?.email ?? '';
  const calHref = booking.cal_booking_id
    ? `https://app.cal.com/booking/${booking.cal_booking_id}`
    : null;
  const statusLabel = booking.status.replace(/_/g, ' ');

  return (
    <div
      className="border border-[var(--border-card)] bg-[var(--bg-card)] p-6"
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h3
            className="text-xl mb-1 text-[var(--text-primary)]"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            {name}
          </h3>
          <div
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatWhen(booking.scheduled_at)}
            {booking.duration_minutes ? ` · ${booking.duration_minutes} min` : ''}
            {email ? ` · ${email}` : ''}
          </div>
        </div>
        <span
          className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: '2px',
            background: 'rgba(232, 93, 47, 0.12)',
            color: '#E85D2F',
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div
            className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Brief
          </div>
          {booking.brief_id ? (
            <Link
              href={`/browse/${booking.brief_id}`}
              className="text-base text-[var(--text-primary)] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
            >
              {briefName}
            </Link>
          ) : (
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No brief attached
            </p>
          )}
        </div>

        <div>
          <div
            className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Track
          </div>
          {track?.file_url ? (
            <div>
              <p
                className="text-sm text-[var(--text-primary)] mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {track.file_name ?? 'Attached track'}
              </p>
              <audio controls src={track.file_url} className="w-full" preload="none" />
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No file attached yet
            </p>
          )}
        </div>
      </div>

      {booking.notes && (
        <p
          className="mt-5 text-sm text-[var(--text-muted)] leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {booking.notes}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {calHref ? (
          <a
            href={calHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#E85D2F] text-[#E85D2F] hover:bg-[#E85D2F] hover:text-[var(--bg-base)] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Open appointment
          </a>
        ) : (
          <a
            href="https://app.cal.com/bookings"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Open Cal.com
          </a>
        )}
        {composer?.id && (
          <Link
            href={`/profile/${composer.id}`}
            className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            Composer profile
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function SessionsTab() {
  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from('bookings')
    .select('id, user_id, brief_id, track_id, duration_minutes, cal_booking_id, scheduled_at, status, notes, recording_url')
    .order('scheduled_at', { ascending: true })
    .returns<BookingRow[]>();

  const rows = bookings ?? [];
  const userIds = [...new Set(rows.map((b) => b.user_id))];
  const briefIds = [...new Set(rows.map((b) => b.brief_id).filter((id): id is string => !!id))];
  const trackIds = [...new Set(rows.map((b) => b.track_id).filter((id): id is string => !!id))];

  const [{ data: profiles }, { data: briefs }, { data: tracksById }, { data: tracksByPair }] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id, full_name, email').in('id', userIds).returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
    briefIds.length
      ? admin.from('briefs').select('id, generated_content').in('id', briefIds).returns<BriefRow[]>()
      : Promise.resolve({ data: [] as BriefRow[] }),
    trackIds.length
      ? admin.from('community_tracks').select('id, file_name, file_url, user_id, brief_id').in('id', trackIds).returns<TrackRow[]>()
      : Promise.resolve({ data: [] as TrackRow[] }),
    userIds.length
      ? admin.from('community_tracks').select('id, file_name, file_url, user_id, brief_id').in('user_id', userIds).order('created_at', { ascending: false }).returns<TrackRow[]>()
      : Promise.resolve({ data: [] as TrackRow[] }),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const briefMap = Object.fromEntries(
    (briefs ?? []).map((b) => [
      b.id,
      (b.generated_content as { codename?: string } | null)?.codename ?? 'Untitled',
    ])
  );
  const trackIdMap = Object.fromEntries((tracksById ?? []).map((t) => [t.id, t]));
  const pairTrackMap = new Map<string, TrackRow>();
  for (const track of tracksByPair ?? []) {
    const key = `${track.user_id}:${track.brief_id}`;
    if (!pairTrackMap.has(key)) pairTrackMap.set(key, track);
  }

  const now = Date.now();
  const upcoming = rows.filter((b) => new Date(b.scheduled_at).getTime() >= now && b.status !== 'cancelled');
  const past = rows.filter((b) => new Date(b.scheduled_at).getTime() < now || b.status === 'cancelled');

  function resolveTrack(booking: BookingRow) {
    if (booking.track_id && trackIdMap[booking.track_id]) return trackIdMap[booking.track_id];
    if (booking.brief_id) return pairTrackMap.get(`${booking.user_id}:${booking.brief_id}`) ?? null;
    return null;
  }

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div
        className="border border-[var(--border-card)] bg-[var(--bg-card)] p-12 text-center"
        style={{ borderRadius: '2px' }}
      >
        <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          No sessions booked yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <section>
        {upcoming.length === 0 ? (
          <div
            className="border border-[var(--border-card)] bg-[var(--bg-card)] p-8"
            style={{ borderRadius: '2px' }}
          >
            <p className="text-sm text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Nothing on the calendar yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {upcoming.map((booking) => (
              <SessionCard
                key={booking.id}
                booking={booking}
                composer={profileMap[booking.user_id]}
                briefName={booking.brief_id ? briefMap[booking.brief_id] ?? 'Untitled' : 'Untitled'}
                track={resolveTrack(booking)}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2
            className="text-2xl tracking-tight mb-5"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            Past sessions
          </h2>
          <div className="flex flex-col gap-4">
            {past.map((booking) => (
              <SessionCard
                key={booking.id}
                booking={booking}
                composer={profileMap[booking.user_id]}
                briefName={booking.brief_id ? briefMap[booking.brief_id] ?? 'Untitled' : 'Untitled'}
                track={resolveTrack(booking)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
