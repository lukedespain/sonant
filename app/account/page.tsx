import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Account
        </div>

        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Welcome, <span className="italic">{profile?.full_name?.split(' ')[0] || 'composer'}</span>.
        </h1>

        <p className="text-base text-[#A8A39A] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Manage your account, check your usage, and jump back into briefs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl">
          <InfoCard label="Email" value={user.email || ''} />
          <InfoCard label="Tier" value="Beta Tester" />
          <InfoCard label="Briefs This Month" value="Unlimited" />
          <InfoCard label="Member Since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} />
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Generate New Brief
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
          >
            View Library
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#141312] border border-[#2A2826] p-5" style={{ borderRadius: '2px' }}>
      <div className="text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div className="text-base" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}