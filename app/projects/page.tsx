import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminView } from '@/lib/admin-view';
import { composerHasClientAccess } from '@/lib/verification';
import { loadProjects, readThread, unreadFor, type ProjectSummary } from '@/lib/projects';
import { composerStatus } from '@/components/SubmissionHistory';
import { AppHeader, AppPage, StatusPill, btn, type Tone } from '@/components/ui';
import { IconLock, IconMessage, IconPlus, IconStar, IconWaveform } from '@/components/shell/icons';

type Activity = { versions: number; latest: { label: string; tone: Tone } | null; unread: number };

function ProjectRow({ project, activity, admin }: { project: ProjectSummary; activity: Activity; admin: boolean }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group grid grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[96px_minmax(0,1fr)_auto] gap-4 md:gap-6 items-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 md:p-4 transition-colors hover:border-[var(--border-hover)]"
    >
      <span className="relative block aspect-square rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
        {project.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.imageUrl} alt="" className={`absolute inset-0 w-full h-full object-cover ${project.closed ? 'grayscale opacity-50' : ''}`} />
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[17px] font-semibold tracking-[-0.02em] truncate">{project.title}</span>
          {activity.unread > 0 && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-[var(--signal)] text-[#0A0A0A] text-[11px] font-semibold">
              <IconMessage size={11} /> {activity.unread} new
            </span>
          )}
        </span>
        <span className="block mt-0.5 text-[13px] text-[var(--text-muted)] truncate">
          {[project.client, project.deadline ? `Due ${project.deadline}` : null, project.demoFee ? `Demo fee ${project.demoFee}` : null]
            .filter(Boolean)
            .join(' · ') || 'Client project'}
        </span>
        <span className="mt-2 flex md:hidden items-center gap-2 flex-wrap">
          <ProjectState project={project} activity={activity} admin={admin} />
        </span>
      </span>
      <span className="hidden md:flex items-center gap-3 shrink-0">
        <ProjectState project={project} activity={activity} admin={admin} />
      </span>
    </Link>
  );
}

function ProjectState({ project, activity, admin }: { project: ProjectSummary; activity: Activity; admin: boolean }) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-dim)] tabular-nums">
        <IconWaveform size={12} />
        {admin ? `${project.invites.length} invited · ${activity.versions} versions` : `${activity.versions} ${activity.versions === 1 ? 'version' : 'versions'}`}
      </span>
      {project.closed ? (
        <StatusPill tone="muted">Closed</StatusPill>
      ) : activity.latest ? (
        <StatusPill tone={activity.latest.tone}>{activity.latest.label}</StatusPill>
      ) : (
        <StatusPill tone="signal">Open</StatusPill>
      )}
    </>
  );
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/projects');

  const admin = createAdminClient();
  const isAdmin = await isAdminView(user);
  const [projects, onRoster] = await Promise.all([
    loadProjects(admin, isAdmin ? undefined : user.id),
    composerHasClientAccess(admin, user.id, isAdmin),
  ]);

  const ids = projects.map((p) => p.id);
  const { data: subs } = ids.length
    ? await admin
        .from('submissions')
        .select('brief_id, user_id, status, created_at')
        .in('brief_id', ids)
        .order('created_at', { ascending: false })
    : { data: [] };
  const rows = (subs ?? []) as { brief_id: string; user_id: string; status: string; created_at: string }[];

  const activity = new Map<string, Activity>();
  await Promise.all(
    projects.map(async (p) => {
      const mine = rows.filter((r) => r.brief_id === p.id && (isAdmin || r.user_id === user.id));
      let unread = 0;
      if (!isAdmin) {
        unread = unreadFor(await readThread(admin, p.id, user.id), 'composer');
      } else {
        const threads = await Promise.all(p.invites.map((i) => readThread(admin, p.id, i.composerId)));
        unread = threads.reduce((n, t) => n + unreadFor(t, 'admin'), 0);
      }
      activity.set(p.id, {
        versions: mine.length,
        latest: !isAdmin && mine[0] ? composerStatus({ status: mine[0].status, briefType: 'client' }) : null,
        unread,
      });
    }),
  );

  const open = projects.filter((p) => !p.closed);
  const closed = projects.filter((p) => p.closed);

  return (
    <AppPage>
      <AppHeader
        title="Projects"
        description={
          isAdmin
            ? 'Every client project. Open one to invite composers, listen to versions, and reply.'
            : 'This is where custom client projects you are invited to live. We send them to you when your catalogue tracks fit what a client needs. Upload versions, get notes from our team, and turn it around fast.'
        }
        actions={
          isAdmin ? (
            <Link href="/admin?tab=projects" className={btn('primary', 'md')}>
              <IconPlus size={14} /> Add project
            </Link>
          ) : null
        }
      />

      {!isAdmin && !onRoster && projects.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 md:p-10 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-center">
          <div>
            <div className="w-12 h-12 rounded-full bg-[var(--signal-soft)] text-[var(--signal)] flex items-center justify-center mb-6">
              <IconLock size={18} />
            </div>
            <h2 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.03em] leading-tight">Projects open up when you join the roster</h2>
            <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed">
              Get a track accepted on a catalogue brief and you join the roster, tagged for the genres and moods it nails. When a client needs that sound, we invite you here.
            </p>
            <Link href="/briefs" className={btn('primary', 'md', 'mt-7')}>
              Write to a brief
            </Link>
          </div>
          <ol className="flex flex-col gap-3">
            {[
              { icon: IconWaveform, title: 'Write to a catalogue brief', body: 'One free submission a week. They stack.' },
              { icon: IconStar, title: 'Get a track accepted', body: 'You join the roster, tagged by what your track nails.' },
              { icon: IconMessage, title: 'Get invited to projects', body: 'Paid client work in your lane, with notes from our team.' },
            ].map((step) => (
              <li key={step.title} className="flex gap-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-base)] p-4">
                <span className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                  <step.icon size={15} />
                </span>
                <span>
                  <span className="block text-[14px] font-medium">{step.title}</span>
                  <span className="block text-[13px] text-[var(--text-muted)]">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-16 text-center">
          <div className="mx-auto mb-5 w-11 h-11 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] flex items-center justify-center">
            <IconStar size={16} />
          </div>
          <p className="text-[17px] font-semibold tracking-[-0.015em]">{isAdmin ? 'No projects yet' : 'You are on the roster'}</p>
          <p className="mt-2 text-[14px] text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            {isAdmin
              ? 'Add a project, then invite the composers who fit it.'
              : 'Nothing for you right now. When a client project fits your sound, it lands here and we email you.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {open.length > 0 && (
            <section className="flex flex-col gap-2.5">
              {open.map((p) => (
                <ProjectRow key={p.id} project={p} activity={activity.get(p.id)!} admin={isAdmin} />
              ))}
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-[14px] text-[var(--text-muted)] mb-3">Closed</h2>
              <div className="flex flex-col gap-2.5 opacity-80">
                {closed.map((p) => (
                  <ProjectRow key={p.id} project={p} activity={activity.get(p.id)!} admin={isAdmin} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppPage>
  );
}
