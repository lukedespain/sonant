import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/auth/actions';
import AccountClient from './AccountClient';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Account
        </div>

        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-10" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Your <span className="italic">profile.</span>
        </h1>

        <AccountClient
          userId={user.id}
          initialName={profile?.full_name ?? ''}
          initialAvatarUrl={(profile as any)?.avatar_url ?? null}
          email={user.email ?? ''}
          tier={profile?.tier === 'pro' ? 'Pro' : 'Beta Tester'}
          memberSince={memberSince}
        />

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/generator"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Generate Brief
          </Link>
          <Link
            href="/browse?tab=mine"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            My Briefs
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            My Submissions
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
