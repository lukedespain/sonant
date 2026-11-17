import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addNotification } from '@/lib/notifications';
import { ADMIN_INBOX, sendProjectMessageEmail } from '@/lib/email';
import { appendMessage } from '@/lib/projects';
import { displayName, loadProjectContext } from '../_shared';

/** Post to a composer's thread on a project. Admins pick the composer; composers post to their own. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadProjectContext(id);
  if (!ctx.user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  if (!ctx.project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { body?: unknown; composerId?: unknown; submissionId?: unknown };
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 });

  const asAdmin = ctx.isAdmin && typeof body.composerId === 'string' && body.composerId !== ctx.user.id;
  const composerId = asAdmin ? (body.composerId as string) : ctx.user.id;
  if (!asAdmin && !ctx.invited && !ctx.isAdmin) {
    return NextResponse.json({ error: 'This project is not open to you.' }, { status: 403 });
  }

  const me = await displayName(ctx.admin, ctx.user.id, asAdmin ? 'Thought Collective' : 'Composer');
  const message = await appendMessage(ctx.admin, id, composerId, {
    author: asAdmin ? 'admin' : 'composer',
    authorName: asAdmin ? 'Thought Collective' : me.name,
    body: text,
    submissionId: typeof body.submissionId === 'string' ? body.submissionId : undefined,
  });

  after(async () => {
    if (asAdmin) {
      const composer = await displayName(ctx.admin, composerId);
      await addNotification(ctx.admin, composerId, {
        type: 'project_message',
        title: `New note on ${ctx.name}`,
        body: text.length > 120 ? `${text.slice(0, 117)}…` : text,
        href: `/projects/${id}`,
      }).catch(() => undefined);
      if (composer.email) {
        await sendProjectMessageEmail({
          to: composer.email,
          projectName: ctx.name,
          projectUrl: ctx.url,
          fromName: 'Thought Collective',
          body: text,
        });
      }
    } else {
      await sendProjectMessageEmail({
        to: ADMIN_INBOX,
        projectName: ctx.name,
        projectUrl: `${ctx.url}?composer=${composerId}`,
        fromName: me.name,
        body: text,
      });
    }
  });

  revalidatePath(`/projects/${id}`);
  return NextResponse.json({ message });
}
