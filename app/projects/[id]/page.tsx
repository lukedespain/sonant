import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { classifyBrief } from '@/lib/brief-kind';
import {
  loadVersions,
  markThreadRead,
  matchComposers,
  readInvites,
  readThread,
  toProjectSummary,
  unreadFor,
} from '@/lib/projects';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import { AdminMenu, DownloadBriefButton } from '@/components/BriefActions';
import CloseBriefButton from '@/components/CloseBriefButton';
import RegenerateImageButton from '@/components/RegenerateImageButton';
import BriefImageUpload from '@/components/BriefImageUpload';
import DeleteBriefButton from '@/components/DeleteBriefButton';
import VersionList from '@/components/projects/VersionList';
import ProjectThread from '@/components/projects/ProjectThread';
import InvitePanel from '@/components/projects/InvitePanel';
import Segmented from '@/components/Segmented';
import { AppPage, SectionHeader, StatusPill, btn, card } from '@/components/ui';
import { IconChevronLeft, IconLock } from '@/components/shell/icons';

type View = 'workspace' | 'brief' | 'invite';

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[14px] text-right">{value}</dd>
    </div>
  );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; composer?: string }>;
}) {
  const { id } = await params;
  const { view: rawView, composer: rawComposer } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/projects/${id}`);

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('briefs')
    .select('id, brief_type, user_id, created_at, genres, moods, generated_content')
    .eq('id', id)
    .maybeSingle();
  if (!row) notFound();
  if (classifyBrief(row) !== 'client') redirect(`/briefs/${id}`);

  const isAdmin = isSiteAdmin(user);
  const project = toProjectSummary(row);
  const invites = readInvites(row.generated_content);
  const invited = invites.some((i) => i.composerId === user.id);

  if (!isAdmin && !invited) {
    return (
      <AppPage width="narrow">
        <div className="mt-10 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-14 md:py-20 text-center">
          <div className="mx-auto mb-6 w-12 h-12 rounded-full bg-[var(--signal-soft)] text-[var(--signal)] flex items-center justify-center">
            <IconLock size={18} />
          </div>
          <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.03em]">This project is invite only</h1>
          <p className="mt-3 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
            We send client projects to roster composers whose catalogue tracks fit the job. Yours will show up in Projects.
          </p>
          <Link href="/projects" className={btn('primary', 'md', 'mt-8')}>
            Go to Projects
          </Link>
        </div>
      </AppPage>
    );
  }

  const brief = row.generated_content as Brief;
  const view: View = rawView === 'brief' ? 'brief' : rawView === 'invite' && isAdmin ? 'invite' : 'workspace';
  const baseHref = `/projects/${id}`;

  // Admins look at one composer's workspace at a time.
  const composerIds = invites.map((i) => i.composerId);
  const { data: profileRows } = composerIds.length
    ? await admin.from('profiles').select('id, full_name, email').in('id', composerIds)
    : { data: [] };
  const names = new Map(
    ((profileRows ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((p) => [
      p.id,
      p.full_name?.trim() || p.email?.split('@')[0] || 'Composer',
    ]),
  );

  const allVersions = isAdmin ? await loadVersions(admin, id) : await loadVersions(admin, id, user.id);
  const threads = isAdmin
    ? new Map(await Promise.all(composerIds.map(async (cid) => [cid, await readThread(admin, id, cid)] as const)))
    : null;

  const activeComposer = isAdmin
    ? (rawComposer && composerIds.includes(rawComposer) ? rawComposer : null) ??
      composerIds.find((cid) => threads && unreadFor(threads.get(cid)!, 'admin') > 0) ??
      composerIds.find((cid) => allVersions.some((v) => v.composerId === cid)) ??
      composerIds[0] ??
      null
    : user.id;

  let thread = activeComposer
    ? isAdmin
      ? threads!.get(activeComposer)!
      : await readThread(admin, id, activeComposer)
    : null;
  if (thread && activeComposer && view === 'workspace') {
    thread = await markThreadRead(admin, id, activeComposer, isAdmin ? 'admin' : 'composer');
  }
  const versions = activeComposer ? allVersions.filter((v) => v.composerId === activeComposer) : [];
  const versionNames = Object.fromEntries(versions.map((v) => [v.id, v.trackName]));
  const matches = view === 'invite' ? await matchComposers(admin, { genres: project.genres, moods: project.moods }) : [];

  const uploadButton =
    !isAdmin && !project.closed ? (
      <SubmitTrackModal
        briefId={id}
        projectName={project.title}
        alreadySubmitted={versions.length > 0}
        mode="project"
        triggerLabel={versions.length > 0 ? 'Upload a new version' : 'Upload a version'}
        triggerClassName={btn('accent', 'md')}
      />
    ) : null;

  return (
    <AppPage>
      <div className="no-print flex items-center justify-between gap-3 mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 h-8 pl-2 pr-3 -ml-2 rounded-full text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
        >
          <IconChevronLeft size={14} /> All projects
        </Link>
        {isAdmin && (
          <AdminMenu>
            <CloseBriefButton briefId={id} closed={!!brief.closedAt} />
            <RegenerateImageButton briefId={id} />
            <BriefImageUpload briefId={id} hasImage={!!brief.imageUrl} />
            <DeleteBriefButton briefId={id} redirectPath="/projects" />
          </AdminMenu>
        )}
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div className="flex items-start gap-5 min-w-0">
          {project.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.imageUrl} alt="" className="hidden sm:block w-20 h-20 rounded-2xl object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] text-[var(--text-muted)]">Client project{project.client ? ` · ${project.client}` : ''}</span>
              {project.closed ? <StatusPill tone="muted">Closed</StatusPill> : <StatusPill tone="signal">Open</StatusPill>}
            </div>
            <h1 className="text-[28px] md:text-[36px] font-semibold tracking-[-0.03em] leading-[1.08] text-balance">{project.title}</h1>
            <p className="mt-2 text-[14px] text-[var(--text-muted)]">
              {[project.deadline ? `Due ${project.deadline}` : null, project.demoFee ? `Demo fee ${project.demoFee}` : null]
                .filter(Boolean)
                .join(' · ') || 'Private to you and Thought Collective'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DownloadBriefButton briefId={id} variant="secondary" size="md" />
          {uploadButton}
        </div>
      </header>

      <Segmented
        items={[
          { href: baseHref + (activeComposer && isAdmin ? `?composer=${activeComposer}` : ''), label: 'Workspace', active: view === 'workspace' },
          { href: `${baseHref}?view=brief`, label: 'The brief', active: view === 'brief' },
          ...(isAdmin ? [{ href: `${baseHref}?view=invite`, label: 'Invite composers', active: view === 'invite', count: invites.length || undefined }] : []),
        ]}
      />

      {view === 'brief' && (
        <div className="max-w-[920px]">
          <BriefDocument brief={brief} />
        </div>
      )}

      {view === 'invite' && (
        <div>
          <p className="mb-5 text-[14px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
            Roster composers ranked by how well their accepted tracks fit this project
            {project.genres.length + project.moods.length > 0 ? ` (${[...project.genres, ...project.moods].join(', ')})` : ''}, then by
            placements. Invited composers get an email and see the project in their Projects tab.
          </p>
          <InvitePanel projectId={id} matches={matches} invited={composerIds} />
        </div>
      )}

      {view === 'workspace' && isAdmin && (
        composerIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 text-center">
            <p className="text-[17px] font-semibold tracking-[-0.015em]">Nobody is invited yet</p>
            <p className="mt-2 text-[14px] text-[var(--text-muted)]">Pick the composers who fit this project. They get an email straight away.</p>
            <Link href={`${baseHref}?view=invite`} className={btn('accent', 'md', 'mt-6')}>
              Invite composers
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
            <nav className={`${card} p-2 lg:sticky lg:top-8`} aria-label="Composers on this project">
              {composerIds.map((cid) => {
                const count = allVersions.filter((v) => v.composerId === cid).length;
                const unread = threads ? unreadFor(threads.get(cid)!, 'admin') : 0;
                const active = cid === activeComposer;
                return (
                  <Link
                    key={cid}
                    href={`${baseHref}?composer=${cid}`}
                    className={`flex items-center gap-3 px-3 h-12 rounded-xl transition-colors ${
                      active ? 'bg-[var(--bg-elevated)] shadow-[inset_0_0_0_1px_var(--border-card)]' : 'hover:bg-[var(--accent-soft)]'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {(names.get(cid) ?? 'C').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{names.get(cid) ?? 'Composer'}</span>
                      <span className="block text-[11px] text-[var(--text-dim)]">
                        {count} {count === 1 ? 'version' : 'versions'}
                      </span>
                    </span>
                    {unread > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--signal)] text-[#0A0A0A] text-[11px] font-semibold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-8 min-w-0">
              <section>
                <SectionHeader title={`${names.get(activeComposer!) ?? 'Composer'}'s versions`} count={versions.length} />
                <VersionList
                  projectId={id}
                  projectName={project.title}
                  versions={versions}
                  admin
                  emptyText="No versions yet. They show up here the moment one is uploaded."
                />
              </section>
              <section>
                <SectionHeader title="Conversation" />
                <ProjectThread
                  key={activeComposer}
                  projectId={id}
                  composerId={activeComposer!}
                  composerName={names.get(activeComposer!) ?? 'the composer'}
                  viewer="admin"
                  messages={thread?.messages ?? []}
                  versionNames={versionNames}
                />
              </section>
            </div>
          </div>
        )
      )}

      {view === 'workspace' && !isAdmin && (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          <div className="flex flex-col gap-8 min-w-0">
            <section>
              <SectionHeader title="Your versions" count={versions.length} actions={versions.length > 0 ? uploadButton : undefined} />
              <VersionList
                projectId={id}
                projectName={project.title}
                versions={versions}
                emptyText="Nothing uploaded yet. Send a first version when you have one. Rough is fine; early notes save time."
              />
            </section>
            <section>
              <SectionHeader title="Conversation" description="Straight to the Thought Collective team." />
              <ProjectThread
                projectId={id}
                composerName="you"
                viewer="composer"
                messages={thread?.messages ?? []}
                versionNames={versionNames}
              />
            </section>
          </div>
          <aside className="flex flex-col gap-3 xl:sticky xl:top-8">
            <div className={`${card} p-5`}>
              <p className="text-[13px] text-[var(--text-muted)]">The job</p>
              <dl className="mt-2 divide-y divide-[var(--border-base)] border-y border-[var(--border-base)]">
                <Fact label="Client" value={project.client || null} />
                <Fact label="Due" value={project.deadline} />
                <Fact label="Demo fee" value={project.demoFee} />
                <Fact label="If it wins" value={project.winFee ?? '70/30 your way'} />
              </dl>
              {(project.genres.length > 0 || project.moods.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[...project.genres, ...project.moods].slice(0, 8).map((t) => (
                    <span key={t} className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent-soft)] text-[12px] text-[var(--text-secondary)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <Link href={`${baseHref}?view=brief`} className={btn('secondary', 'md', 'w-full mt-5')}>
                Read the full brief
              </Link>
            </div>
            <div className={`${card} p-5`}>
              <p className="text-[14px] font-medium">How projects work</p>
              <ul className="mt-3 flex flex-col gap-2.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
                <li>Upload as many versions as you like. No credits used.</li>
                <li>Our team replies here with notes, fast.</li>
                <li>Strong versions go to the client with a demo fee. If one wins, we split 70/30 your way.</li>
                <li>Not picked? It is still your track. Submit it to a catalogue brief if it fits one.</li>
                <li>Private: please do not share the brief or references.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </AppPage>
  );
}
