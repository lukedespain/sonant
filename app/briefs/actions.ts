'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { sendDecisionEmail, sendSubmissionReceivedEmail } from '@/lib/email';
import { addNotification } from '@/lib/notifications';
import { ADMIN_USER_ID } from '@/lib/admin';
import { announceNewBrief, briefDisplayName } from '@/lib/brief-announcements';
import { catalogPartnerFromBrief } from '@/lib/partners';
import { readHandoffs } from '@/lib/handoff';

type Mode = 'brand' | 'film' | 'games';

interface SaveBriefInput {
  mode: Mode;
  target: string;
  genres: string[];
  moods: string[];
  generatedContent: Record<string, unknown>;
  announce?: boolean;
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

  revalidatePath('/dashboard');
  revalidatePath('/briefs');

  if (input.announce === true && user.id === ADMIN_USER_ID) {
    try {
      const admin = createAdminClient();
      await announceNewBrief({
        admin,
        kind: 'featured',
        briefId: data.id,
        briefName: briefDisplayName(input.generatedContent as { codename?: string }),
      });
    } catch (error) {
      console.error('Featured brief announcement failed:', error);
    }
  }

  return { success: true, briefId: data.id };
}
export async function deleteBrief(briefId: string): Promise<{ error?: string; hasActivity?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to delete briefs.' };
  if (!briefId) return { error: 'Missing brief.' };

  const admin = createAdminClient();
  const { data: brief } = await admin.from('briefs').select('user_id').eq('id', briefId).maybeSingle();
  if (!brief) return { error: 'Brief not found.' };
  if (!isSiteAdmin(user) && brief.user_id !== user.id) return { error: 'You can only delete your own briefs.' };

  // Tracks and submissions point at the brief, so deleting it would fail (or
  // orphan composers' work). Those briefs get moved to practice instead.
  const [{ count: subCount }, { count: trackCount }] = await Promise.all([
    admin.from('submissions').select('id', { count: 'exact', head: true }).eq('brief_id', briefId),
    admin.from('community_tracks').select('id', { count: 'exact', head: true }).eq('brief_id', briefId),
  ]);
  if ((subCount ?? 0) + (trackCount ?? 0) > 0) {
    return {
      error: 'Composers have tracks or submissions on this brief, so it cannot be deleted.',
      hasActivity: true,
    };
  }

  const { error } = await admin.from('briefs').delete().eq('id', briefId);
  if (error) {
    console.error('Delete brief error:', error);
    return { error: 'Could not delete this brief.' };
  }

  revalidatePath('/library');
  revalidatePath('/briefs');
  return {};
}

export async function moveBriefToPractice(briefId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return { error: 'Not authorized.' };

  const admin = createAdminClient();
  const { data: brief } = await admin
    .from('briefs')
    .select('brief_type, generated_content')
    .eq('id', briefId)
    .maybeSingle();
  if (!brief) return { error: 'Brief not found.' };
  if (brief.brief_type === 'client') return { error: 'Client briefs cannot move to practice.' };

  const content = { ...((brief.generated_content ?? {}) as Record<string, unknown>) };
  delete content.catalogId;
  delete content.catalog;
  // Practice briefs have no hero image. Keep the URL so a move can be undone by hand.
  if (content.imageUrl) {
    content.archivedImageUrl = content.imageUrl;
    delete content.imageUrl;
  }

  const { error } = await admin
    .from('briefs')
    .update({ brief_type: 'community', generated_content: content })
    .eq('id', briefId);
  if (error) {
    console.error('Move to practice error:', error);
    return { error: 'Could not move this brief.' };
  }

  revalidatePath('/briefs');
  revalidatePath(`/briefs/${briefId}`);
  return {};
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
  revalidatePath(`/briefs/${briefId}`);
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

  revalidatePath(`/briefs/${briefId}`);
  return { success: true };
}

export async function setDiscoInboxUrl(briefId: string, inboxUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) return { error: 'Not authorized.' };

  const trimmed = inboxUrl.trim() || null;
  if (trimmed) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { error: 'That does not look like a Disco link.' };
      }
    } catch {
      return { error: 'That does not look like a Disco link.' };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('briefs')
    .update({ disco_inbox_url: trimmed })
    .eq('id', briefId);

  if (error) {
    if (/disco_inbox_url/i.test(error.message ?? '')) {
      return { error: 'Run the Disco delivery SQL in the dashboard first.' };
    }
    return { error: error.message };
  }

  revalidatePath(`/briefs/${briefId}`);
  return { success: true };
}

export async function deleteCommunityTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: track } = await admin
    .from('community_tracks')
    .select('id, user_id, brief_id, storage_path')
    .eq('id', trackId)
    .single();

  if (!track) return { error: 'Track not found' };
  if (track.user_id !== user.id && !isSiteAdmin(user)) return { error: 'Not authorized' };

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

  revalidatePath(`/briefs/${track.brief_id}`);
  revalidatePath(`/profile/${track.user_id}`);
  revalidatePath('/briefs');
  return {};
}

export async function setFeaturedTrack(briefId: string, trackId: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isSiteAdmin(user)) return { error: 'Not authorized.' };

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

  revalidatePath(`/briefs/${briefId}`);
  revalidatePath('/briefs');
  return {};
}

export type SubmissionDecision = 'sent_to_catalog' | 'accepted' | 'not_accepted';

export async function recordDecision(params: {
  submissionId: string;
  decision: SubmissionDecision;
  feedback: string;
}) {
  const { submissionId, decision, feedback } = params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isSiteAdmin(user)) {
    return { error: 'Not authorized.' };
  }
  if (!feedback.trim()) {
    return { error: 'Feedback is required.' };
  }

  const admin = createAdminClient();

  const { data: before } = await admin
    .from('submissions')
    .select('status')
    .eq('id', submissionId)
    .maybeSingle();
  const wasSent = before?.status === 'sent_to_catalog';

  const { data: submission, error: updateError } = await admin
    .from('submissions')
    .update({ status: decision, feedback })
    .eq('id', submissionId)
    .select('brief_id, user_id')
    .single();

  if (updateError || !submission) {
    console.error('recordDecision update error:', updateError);
    return { error: 'Could not update submission.' };
  }

  const { data: brief } = await admin
    .from('briefs')
    .select('generated_content')
    .eq('id', submission.brief_id)
    .single();

  const { data: composer } = await admin.auth.admin.getUserById(submission.user_id);

  const projectName =
    (brief?.generated_content as { codename?: string })?.codename ?? 'your brief';
  const partner = catalogPartnerFromBrief(brief?.generated_content);
  const catalogName = partner?.name ?? 'Sonant';

  if (decision === 'accepted' && composer?.user) {
    const handoffs = readHandoffs(composer.user.app_metadata);
    if (!handoffs[submissionId]) {
      handoffs[submissionId] = { catalogId: partner?.id ?? 'sonant', offeredAt: new Date().toISOString() };
      const { error: offerError } = await admin.auth.admin.updateUserById(submission.user_id, {
        app_metadata: { ...composer.user.app_metadata, handoffs },
      });
      if (offerError) console.error('Could not create catalog offer:', offerError);
    }
  }
  const composerEmail = composer?.user?.email;

  if (composerEmail) {
    await sendDecisionEmail({
      to: composerEmail,
      projectName,
      catalogName,
      decision,
      wasSent,
      feedback,
    });
  }

  const notification =
    decision === 'sent_to_catalog'
      ? { type: 'catalog_sent' as const, title: `Sent to ${catalogName}`, body: `${projectName} is with ${catalogName} for a decision.` }
      : decision === 'accepted'
        ? { type: 'catalog_accepted' as const, title: `Accepted by ${catalogName}`, body: `${projectName} was accepted by ${catalogName}.` }
        : { type: 'catalog_reviewed' as const, title: 'Catalog review', body: `Written feedback is ready for ${projectName}.` };

  try {
    await addNotification(admin, submission.user_id, { ...notification, href: '/dashboard' });
  } catch (error) {
    console.error('Catalog notification failed:', error);
  }

  revalidatePath('/admin');
  revalidatePath('/submissions-admin');
  revalidatePath('/submissions');
  revalidatePath('/dashboard');
  revalidatePath('/music');
  revalidatePath(`/profile/${submission.user_id}`);
  return { success: true };
}

export async function setTrackVisibility(trackId: string, isPublic: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient();
  const { data: track } = await admin
    .from('community_tracks')
    .select('id, user_id, brief_id')
    .eq('id', trackId)
    .single();

  if (!track) return { error: 'Track not found' };
  if (track.user_id !== user.id && !isSiteAdmin(user)) return { error: 'Not authorized' };

  const { setTrackPublic } = await import('@/lib/track-privacy');
  try {
    await setTrackPublic(trackId, isPublic);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not update visibility' };
  }

  revalidatePath(`/briefs/${track.brief_id}`);
  revalidatePath(`/profile/${track.user_id}`);
  return {};
}