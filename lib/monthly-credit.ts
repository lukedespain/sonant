import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

/** UTC calendar date. Month is 1–12. */
export type Ymd = { y: number; m: number; d: number };

export function toYmd(value: string | Date): Ymd {
  const d = typeof value === 'string' ? new Date(value) : value;
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

export function todayYmd(now = new Date()): Ymd {
  return toYmd(now);
}

export function formatYmd(date: Ymd): string {
  const m = String(date.m).padStart(2, '0');
  const d = String(date.d).padStart(2, '0');
  return `${date.y}-${m}-${d}`;
}

export function parseYmd(value: string | null | undefined): Ymd | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Signup-day anniversary n months later, clamped for short months. */
export function addMonths(signup: Ymd, months: number): Ymd {
  const total = signup.m - 1 + months;
  const y = signup.y + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12 + 1;
  return { y, m, d: Math.min(signup.d, daysInMonth(y, m)) };
}

export function compareYmd(a: Ymd, b: Ymd): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function daysBetween(from: Ymd, to: Ymd): number {
  const ms = Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(from.y, from.m - 1, from.d);
  return Math.round(ms / 86_400_000);
}

/**
 * How often every account gets a free submission credit. Credits stack and
 * never expire. Switch to 'month' when reviewing gets to be too much.
 */
export const CREDIT_PERIOD: 'week' | 'month' = 'week';

/** Most periods paid out in one catch-up, as a guard against bad dates. */
const MAX_CATCH_UP_PERIODS = 520;

/** The nth credit date after signup (n = 1 is one period after signup). */
export function addPeriods(signup: Ymd, n: number): Ymd {
  if (CREDIT_PERIOD === 'month') return addMonths(signup, n);
  const d = new Date(Date.UTC(signup.y, signup.m - 1, signup.d + 7 * n));
  return toYmd(d);
}

/** Index of the first credit date strictly after `after`. */
function firstPeriodAfter(signup: Ymd, after: Ymd): number {
  let n =
    CREDIT_PERIOD === 'week'
      ? Math.max(1, Math.floor(daysBetween(signup, after) / 7))
      : Math.max(1, (after.y - signup.y) * 12 + (after.m - signup.m) - 1);
  while (n > 1 && compareYmd(addPeriods(signup, n - 1), after) > 0) n--;
  while (compareYmd(addPeriods(signup, n), after) <= 0) n++;
  return n;
}

/**
 * Credits after the signup credit. `lastGranted` is the signup date until the
 * first one is paid, then each credit date as it is granted. Every missed
 * period is paid, so credits stack while someone is away.
 */
export function dueCreditDates(signup: Ymd, lastGranted: Ymd, today: Ymd): Ymd[] {
  const due: Ymd[] = [];
  for (let n = firstPeriodAfter(signup, lastGranted); due.length < MAX_CATCH_UP_PERIODS; n++) {
    const date = addPeriods(signup, n);
    if (compareYmd(date, today) > 0) break;
    due.push(date);
  }
  return due;
}

export function nextCreditDate(signup: Ymd, lastGranted: Ymd, today: Ymd): Ymd {
  const after = compareYmd(today, lastGranted) > 0 ? today : lastGranted;
  return addPeriods(signup, firstPeriodAfter(signup, after));
}

export type MonthlyCreditState = {
  credits: number;
  granted: number;
  daysUntilNext: number;
  nextCreditOn: string;
};

function readMetaDate(user: User | null | undefined): Ymd | null {
  const raw = user?.user_metadata?.monthly_credit_on;
  return typeof raw === 'string' ? parseYmd(raw) : null;
}

async function persistLastGrant(
  admin: SupabaseClient,
  user: User,
  last: Ymd
): Promise<void> {
  const iso = formatYmd(last);
  const { error } = await admin
    .from('profiles')
    .update({ monthly_credit_on: iso })
    .eq('id', user.id);
  if (error && !/monthly_credit_on/i.test(error.message)) {
    console.error('Could not store monthly_credit_on on profile', error.message);
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, monthly_credit_on: iso },
  });
  if (metaError) {
    console.error('Could not store monthly_credit_on on user', metaError.message);
  }
}

/**
 * Grant any signup-anniversary credits that are due, then report days until
 * the next one. The credit given at signup is the first month; each later
 * month on that calendar day adds one more.
 */
export async function ensureMonthlySubmissionCredit(
  admin: SupabaseClient,
  user: User,
  now = new Date()
): Promise<MonthlyCreditState | null> {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('created_at, submission_credits, monthly_credit_on')
    .eq('id', user.id)
    .maybeSingle();

  if (error && /monthly_credit_on/i.test(error.message)) {
    const fallback = await admin
      .from('profiles')
      .select('created_at, submission_credits')
      .eq('id', user.id)
      .maybeSingle();
    if (fallback.error || !fallback.data) return null;
    return settleMonthlyCredit(admin, user, fallback.data, now);
  }

  if (error || !profile) return null;
  return settleMonthlyCredit(admin, user, profile, now);
}

async function settleMonthlyCredit(
  admin: SupabaseClient,
  user: User,
  profile: {
    created_at?: string | null;
    submission_credits?: number | null;
    monthly_credit_on?: string | null;
  },
  now: Date
): Promise<MonthlyCreditState | null> {
  const signup = parseYmd(profile.created_at ?? user.created_at) ?? todayYmd(now);
  const today = todayYmd(now);
  const lastGranted =
    parseYmd(profile.monthly_credit_on) ?? readMetaDate(user) ?? signup;
  const due = dueCreditDates(signup, lastGranted, today);
  let credits = profile.submission_credits ?? 0;
  let granted = 0;
  let last = lastGranted;

  if (due.length > 0) {
    const { error } = await admin.rpc('increment_credits', {
      p_user_id: user.id,
      p_submission_delta: due.length,
      p_session_delta: 0,
    });
    if (error) {
      console.error('Monthly credit grant failed', error.message);
    } else {
      granted = due.length;
      credits += due.length;
      last = due[due.length - 1];
      await persistLastGrant(admin, user, last);
    }
  } else if (!profile.monthly_credit_on && !readMetaDate(user)) {
    await persistLastGrant(admin, user, last);
  }

  const next = nextCreditDate(signup, last, today);
  return {
    credits,
    granted,
    daysUntilNext: Math.max(1, daysBetween(today, next)),
    nextCreditOn: formatYmd(next),
  };
}
