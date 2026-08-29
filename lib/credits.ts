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
