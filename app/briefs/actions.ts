'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendDecisionEmail, sendSubmissionReceivedEmail } from '@/lib/email';

type Mode = 'brand' | 'film' | 'games';

interface SaveBriefInput {
  mode: Mode;
  target: string;
  genres: string[];
  moods: string[];
  generatedContent: Record<string, unknown>;
}

export async function saveBrief(input: SaveBriefInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to save briefs.' };
  }

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      user_id: user.id,
      mode: input.mode,
      target: input.target,
      genres: input.genres,
      moods: input.moods,
      generated_content: input.generatedContent,
      status: 'saved',
    })
    .select()
    .single();

  if (error) {
    console.error('Save brief error:', error);
    return { error: 'Could not save brief. Please try again.' };
  }

  revalidatePath('/account');
  return { success: true, briefId: data.id };
}
export async function deleteBrief(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const briefId = formData.get('briefId') as string;

  if (!briefId) {
    redirect('/library');
  }

  const { error } = await supabase
    .from('briefs')
    .delete()
    .eq('id', briefId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete brief error:', error);
  }

  revalidatePath('/library');
  redirect('/library');
}
export async function submitTrack(briefId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to submit a track.' };
  }

  // Confirm the brief belongs to this user before recording a submission.
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('id, generated_content')
    .eq('id', briefId)
    .eq('user_id', user.id)
    .single();

  if (briefError || !brief) {
    return { error: 'Brief not found.' };
  }

  const { error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      brief_id: briefId,
      status: 'pending',
    });

  if (error) {
    console.error('Submit track error:', error);
    return { error: 'Could not record submission. Please try again.' };
  }

  // Send the "submission received" email — best-effort, never blocks.
  if (user.email) {
    const projectName =
      (brief as { generated_content?: { codename?: string } })
        ?.generated_content?.codename ?? 'your brief';
    await sendSubmissionReceivedEmail({
      to: user.email,
      projectName,
    });
  }

  revalidatePath('/library');
  revalidatePath(`/library/${briefId}`);
  return { success: true };
}

export async function getSubmissionStatus(briefId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('submissions')
    .select('status, created_at')
    .eq('brief_id', briefId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data; // null if no submission, else { status, created_at }
}
export async function recordDecision(params: {
  submissionId: string;
  accepted: boolean;
  feedback: string;
}) {
  const { submissionId, accepted, feedback } = params;

  // Verify the caller is the admin.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

  if (!user || user.id !== ADMIN_USER_ID) {
    return { error: 'Not authorized.' };
  }

  if (!feedback.trim()) {
    return { error: 'Feedback is required.' };
  }

  // Use the admin client to update another user's submission row.
  const admin = createAdminClient();

  const newStatus = accepted ? 'accepted' : 'not_accepted';

  const { data: submission, error: updateError } = await admin
    .from('submissions')
    .update({ status: newStatus, feedback })
    .eq('id', submissionId)
    .select('brief_id, user_id')
    .single();

  if (updateError || !submission) {
    console.error('recordDecision update error:', updateError);
    return { error: 'Could not update submission.' };
  }

  // Look up the brief's project name and the composer's email for the email.
  const { data: brief } = await admin
    .from('briefs')
    .select('generated_content')
    .eq('id', submission.brief_id)
    .single();

  const { data: composer } = await admin.auth.admin.getUserById(
    submission.user_id
  );

  const projectName =
    (brief?.generated_content as { codename?: string })?.codename ?? 'your brief';
  const composerEmail = composer?.user?.email;

  // Send the decision email (best-effort — does not block the decision).
  if (composerEmail) {
    await sendDecisionEmail({
      to: composerEmail,
      projectName,
      accepted,
      feedback,
    });
  }

  revalidatePath('/admin');
  return { success: true };
}