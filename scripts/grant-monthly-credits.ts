import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  addMonths,
  daysBetween,
  dueCreditDates,
  ensureMonthlySubmissionCredit,
  nextCreditDate,
  type Ymd,
} from '../lib/monthly-credit';

const SZYMON = '0d735c13-fd8b-4fa4-a9c8-d53e86559030';

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

function testDates() {
  const signup: Ymd = { y: 2026, m: 5, d: 27 };
  const today: Ymd = { y: 2026, m: 9, d: 2 };
  assert(addMonths(signup, 1).d === 27 && addMonths(signup, 1).m === 6, 'Jun 27');
  assert(addMonths({ y: 2026, m: 1, d: 31 }, 1).d === 28, 'Jan 31 → Feb 28 2026');
  assert(addMonths({ y: 2026, m: 1, d: 31 }, 2).d === 31 && addMonths({ y: 2026, m: 1, d: 31 }, 2).m === 3, 'Mar 31');
  const due = dueCreditDates(signup, signup, today);
  assert(due.length === 3, `expected 3 due, got ${due.length}`);
  assert(due.map((d) => `${d.m}-${d.d}`).join(',') === '6-27,7-27,8-27', 'due dates');
  const next = nextCreditDate(signup, due[2], today);
  assert(next.m === 9 && next.d === 27, 'next is Sep 27');
  assert(daysBetween(today, next) === 25, `days until next, got ${daysBetween(today, next)}`);
  assert(dueCreditDates(signup, { y: 2026, m: 8, d: 27 }, today).length === 0, 'szymon stamped');
  console.log('date checks ok');
}

async function main() {
  testDates();
  if (process.argv.includes('--test-only')) return;

  const env = Object.fromEntries(
    readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i).trim(), v];
      })
  );

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: szymon } = await admin.auth.admin.getUserById(SZYMON);
  if (szymon.user) {
    await admin.auth.admin.updateUserById(SZYMON, {
      user_metadata: { ...szymon.user.user_metadata, monthly_credit_on: '2026-08-27' },
    });
    await admin.from('profiles').update({ monthly_credit_on: '2026-08-27' }).eq('id', SZYMON);
    console.log('stamped szymon at 2026-08-27');
  }

  const { data: profiles } = await admin.from('profiles').select('id, email, submission_credits, created_at');
  const results = [];
  for (const row of profiles ?? []) {
    const { data } = await admin.auth.admin.getUserById(row.id);
    if (!data.user) continue;
    const before = row.submission_credits ?? 0;
    const state = await ensureMonthlySubmissionCredit(admin, data.user);
    results.push({
      email: row.email,
      created: row.created_at,
      before,
      after: state?.credits ?? before,
      granted: state?.granted ?? 0,
      next: state?.nextCreditOn,
      days: state?.daysUntilNext,
    });
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
