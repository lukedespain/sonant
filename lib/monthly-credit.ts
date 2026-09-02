import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

/** UTC calendar date. Month is 1–12. */
export type Ymd = { y: number; m: number; d: number };

const MAX_CATCH_UP = 12;

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
 * Monthly credits after the signup credit. `lastGranted` is the signup date
 * until the first anniversary is paid, then each anniversary as it is granted.
 */
export function dueCreditDates(signup: Ymd, lastGranted: Ymd, today: Ymd): Ymd[] {
  const due: Ymd[] = [];
  for (let n = 1; n <= 36 && due.length < MAX_CATCH_UP; n++) {
    const date = addMonths(signup, n);
    if (compareYmd(date, today) > 0) break;
    if (compareYmd(date, lastGranted) > 0) due.push(date);
  }
  return due;
}

export function nextCreditDate(signup: Ymd, lastGranted: Ymd, today: Ymd): Ymd {
  for (let n = 1; n <= 48; n++) {
    const date = addMonths(signup, n);
    if (compareYmd(date, today) > 0 && compareYmd(date, lastGranted) > 0) return date;
  }
  return addMonths(signup, 1);
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
