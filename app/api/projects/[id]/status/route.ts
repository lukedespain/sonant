import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addNotification } from '@/lib/notifications';
import { sendProjectStatusEmail } from '@/lib/email';
import { displayName, loadProjectContext } from '../_shared';

const COPY: Record<string, { heading: string; body: (name: string) => string } | undefined> = {
  sent_to_catalog: { heading: 'Sent to the client', body: (n) => `We sent your version for ${n} to the client. We will tell you as soon as they decide.` },
  accepted: { heading: 'The client picked your track', body: (n) => `Great news: the client picked your version for ${n}. We will be in touch about next steps.` },
  not_accepted: {
    heading: 'The client went another way',
    body: (n) => `The client went with another option for ${n}. Your track is still yours: submit it to a catalogue brief if it fits one.`,
  },
};

/** Admins move a project upload along: back to review, sent to the client, picked, or not picked. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadProjectContext(id);
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  if (!ctx.project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { submissionId?: unknown; status?: unknown };
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
  const status = typeof body.status === 'string' ? body.status : '';
  if (!['received', 'sent_to_catalog', 'accepted', 'not_accepted'].includes(status)) {
    return NextResponse.json({ error: 'Unknown status.' }, { status: 400 });
  }

  const { data: row, error } = await ctx.admin
    .from('submissions')
    .update({ status })
    .eq('id', submissionId)
    .eq('brief_id', id)
    .select('user_id')
    .maybeSingle();
  if (error || !row) return NextResponse.json({ error: 'Could not update that version.' }, { status: 500 });

  const copy = COPY[status];
  if (copy) {
    const composerId = row.user_id as string;
    after(async () => {
      await addNotification(ctx.admin, composerId, {
        type: 'project_update',
        title: copy.heading,
        body: copy.body(ctx.name),
        href: `/projects/${id}`,
      }).catch(() => undefined);
      const who = await displayName(ctx.admin, composerId);
      if (who.email) {
        await sendProjectStatusEmail({ to: who.email, projectName: ctx.name, projectUrl: ctx.url, heading: copy.heading, body: copy.body(ctx.name) });
      }
    });
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath('/dashboard');
  return NextResponse.json({ ok: true });
}
