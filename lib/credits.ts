import type { SupabaseClient } from '@supabase/supabase-js';

/** A racing writer can invalidate our read; give up rather than spin forever. */
const MAX_ATTEMPTS = 8;

export type SpendResult =
  | { ok: true }
  | { ok: false; reason: 'insufficient' }
  | { ok: false; reason: 'error'; message: string };

/**
 * Take exactly one submission credit, or report why it could not be taken.
 *
 * PostgREST cannot send `SET submission_credits = submission_credits - 1`, so
 * this is a compare-and-swap instead: read the balance, then write only if the
 * row still holds the value we read. Postgres re-checks that condition against
 * the committed row, so of two confirms racing on a single credit exactly one
 * update matches and the loser retries against the balance it lost to. The
 * result is the same as a single conditional statement without needing a
 * database function.
 */
export async function spendSubmissionCredit(
  admin: SupabaseClient,
  userId: string
): Promise<SpendResult> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Stagger retries so simultaneous callers stop colliding on every pass.
    // The first attempt never waits, so the ordinary case costs nothing.
    if (attempt > 0) await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));

    const { data: profile, error: readError } = await admin
      .from('profiles')
      .select('submission_credits')
      .eq('id', userId)
      .single();

    if (readError) return { ok: false, reason: 'error', message: readError.message };

    const credits = (profile as { submission_credits?: number } | null)?.submission_credits ?? 0;
    if (credits < 1) return { ok: false, reason: 'insufficient' };

    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({ submission_credits: credits - 1 })
      .eq('id', userId)
      .eq('submission_credits', credits)
      .select('id');

    if (updateError) return { ok: false, reason: 'error', message: updateError.message };
    if (updated && updated.length > 0) return { ok: true };
  }

  return {
    ok: false,
    reason: 'error',
    message: 'Could not spend your submission credit. Please try again.',
  };
}

export type AdjustCreditsResult =
  | { ok: true; submissionCredits: number; sessionCredits: number }
  | { ok: false; message: string };

/**
 * Add or remove credits without going below zero. Same compare-and-swap as
 * spend, so two admin clicks cannot leave a negative balance.
 */
export async function adjustCredits(
  admin: SupabaseClient,
  userId: string,
  submissionDelta: number,
  sessionDelta: number
): Promise<AdjustCreditsResult> {
  if (!Number.isInteger(submissionDelta) || !Number.isInteger(sessionDelta)) {
    return { ok: false, message: 'Credit changes must be whole numbers.' };
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));

    const { data: profile, error: readError } = await admin
      .from('profiles')
      .select('submission_credits, session_credits')
      .eq('id', userId)
      .single();

    if (readError) return { ok: false, message: readError.message };

    const currentSub = (profile as { submission_credits?: number } | null)?.submission_credits ?? 0;
    const currentSess = (profile as { session_credits?: number } | null)?.session_credits ?? 0;
    const nextSub = Math.max(0, currentSub + submissionDelta);
    const nextSess = Math.max(0, currentSess + sessionDelta);

    if (nextSub === currentSub && nextSess === currentSess) {
      return { ok: true, submissionCredits: currentSub, sessionCredits: currentSess };
    }

    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({ submission_credits: nextSub, session_credits: nextSess })
      .eq('id', userId)
      .eq('submission_credits', currentSub)
      .eq('session_credits', currentSess)
      .select('submission_credits, session_credits');

    if (updateError) return { ok: false, message: updateError.message };
    if (updated && updated.length > 0) {
      const row = updated[0] as { submission_credits: number; session_credits: number };
      return { ok: true, submissionCredits: row.submission_credits, sessionCredits: row.session_credits };
    }
  }

  return { ok: false, message: 'Could not update credits. Please try again.' };
}

/** Put a credit back after a debit whose submission did not end up recorded. */
export async function refundSubmissionCredit(admin: SupabaseClient, userId: string) {
  const { error } = await admin.rpc('increment_credits', {
    p_user_id: userId,
    p_submission_delta: 1,
    p_session_delta: 0,
  });
  if (error) {
    console.error('Could not refund submission credit', { userId, error });
    return false;
  }
  return true;
}
