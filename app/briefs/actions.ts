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

  // Increment briefs_generated_this_month, resetting if we've rolled into a new month.
  try {
    const admin = createAdminClient();
    const now = new Date();

    const { data: profile } = await admin
      .from('profiles')
      .select('briefs_generated_this_month, monthly_reset_date')
      .eq('id', user.id)
      .single();

    const lastReset = profile?.monthly_reset_date ? new Date(profile.monthly_reset_date) : null;
    const shouldReset =
      !lastReset ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear();

    const updatePayload: Record<string, unknown> = {
      briefs_generated_this_month: shouldReset ? 1 : (profile?.briefs_generated_this_month ?? 0) + 1,
    };
    if (shouldReset) updatePayload.monthly_reset_date = now.toISOString();

    await admin.from('profiles').update(updatePayload).eq('id', user.id);
  } catch (counterErr) {
    // Counter failure is non-blocking — brief is already saved.
    console.error('Counter update error:', counterErr);
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
  const redirectTo = (formData.get('redirectPath') as string | null) ?? '/library';

  if (!briefId) {
    redirect(redirectTo);
  }

  const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
  const isAdmin = user.id === ADMIN_USER_ID;

  // Admin can delete any brief; regular users can only delete their own.
  const admin = createAdminClient();
  const query = admin.from('briefs').delete().eq('id', briefId);
  const { error } = isAdmin ? await query : await query.eq('user_id', user.id);

  if (error) {
    console.error('Delete brief error:', error);
  }

  revalidatePath('/library');
  revalidatePath('/browse');
  redirect(redirectTo);
}
export async function submitTrack(briefId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to submit a track.' };
  }

  // Confirm the brief exists — admin client bypasses RLS so composers can
  // submit tracks to any brief in the catalog, not just their own.
  const admin = createAdminClient();
  const { data: brief, error: briefError } = await admin
    .from('briefs')
    .select('id, generated_content')
    .eq('id', briefId)
    .single();

  if (briefError || !brief) {
    return { error: 'Brief not found.' };
  }

  const { error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      brief_id: briefId,
      status: 'received',
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
  revalidatePath(`/browse/${briefId}`);
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
export async function setDiscoPlaylistId(briefId: string, playlistId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
  if (!user || user.id !== ADMIN_USER_ID) return { error: 'Not authorized.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('briefs')
    .update({ disco_playlist_id: playlistId.trim() || null })
    .eq('id', briefId);

  if (error) return { error: error.message };

  revalidatePath(`/browse/${briefId}`);
  return { success: true };
}

export async function deleteCommunityTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
  const admin = createAdminClient();

  const { data: track } = await admin
    .from('community_tracks')
    .select('id, user_id, brief_id, storage_path')
    .eq('id', trackId)
    .single();

  if (!track) return { error: 'Track not found' };
  if (track.user_id !== user.id && user.id !== ADMIN_USER_ID) return { error: 'Not authorized' };

  // If this track was set as the brief's featured track, clear the denormalized URL
  // (featured_track_id will be nulled automatically by ON DELETE SET NULL)
  const { data: brief } = await admin
    .from('briefs')
    .select('featured_track_id')
    .eq('id', track.brief_id)
    .single();
  if (brief?.featured_track_id === trackId) {
    await admin.from('briefs').update({ featured_track_url: null }).eq('id', track.brief_id);
  }

  await admin.storage.from('community-tracks').remove([track.storage_path]);

  const { error } = await admin.from('community_tracks').delete().eq('id', trackId);
  if (error) return { error: error.message };

  revalidatePath(`/browse/${track.brief_id}`);
  revalidatePath('/browse');
  return {};
}

export async function setFeaturedTrack(briefId: string, trackId: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';
  if (!user || user.id !== ADMIN_USER_ID) return { error: 'Not authorized.' };

  const admin = createAdminClient();

  let trackUrl: string | null = null;
  if (trackId) {
    const { data: track } = await admin
      .from('community_tracks')
      .select('file_url')
      .eq('id', trackId)
      .single();
    if (!track) return { error: 'Track not found.' };
    trackUrl = track.file_url;
  }

  const { error } = await admin
    .from('briefs')
    .update({ featured_track_id: trackId, featured_track_url: trackUrl })
    .eq('id', briefId);

  if (error) return { error: error.message };

  revalidatePath(`/browse/${briefId}`);
  revalidatePath('/browse');
  return {};
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