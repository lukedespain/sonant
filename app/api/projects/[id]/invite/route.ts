import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addNotification } from '@/lib/notifications';
import { sendProjectInviteEmail } from '@/lib/email';
import { readInvites, type ProjectInvite } from '@/lib/projects';
import { displayName, loadProjectContext } from '../_shared';

/** Admins add or remove composers from a client project. New invitees get an email. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadProjectContext(id);
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  if (!ctx.project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { add?: unknown; remove?: unknown };
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 100) : []);
  const add = ids(body.add);
  const remove = new Set(ids(body.remove));

  const current = readInvites(ctx.content).filter((i) => !remove.has(i.composerId));
  const existing = new Set(current.map((i) => i.composerId));
  const now = new Date().toISOString();
  const added: ProjectInvite[] = add.filter((cid) => !existing.has(cid)).map((composerId) => ({ composerId, invitedAt: now }));
  const invites = [...current, ...added];

  const { error } = await ctx.admin
    .from('briefs')
    .update({ generated_content: { ...ctx.content, invites } })
    .eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not save the invites.' }, { status: 500 });

  const due = typeof ctx.content.deadline === 'string' ? ctx.content.deadline : null;
  after(async () => {
    for (const invite of added) {
      const who = await displayName(ctx.admin, invite.composerId);
      await addNotification(ctx.admin, invite.composerId, {
        type: 'project_invite',
        title: `New project: ${ctx.name}`,
        body: 'You were picked for a client project. Open it to read the brief and upload.',
        href: `/projects/${id}`,
      }).catch(() => undefined);
      if (who.email) await sendProjectInviteEmail({ to: who.email, projectName: ctx.name, projectUrl: ctx.url, due });
    }
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
  return NextResponse.json({ invites, added: added.length });
}
