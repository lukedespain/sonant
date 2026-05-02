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
    <div
      className="min-h-screen px-6 py-12"
      style={{
        background: '#0A0908',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        color: '#F5F1E8',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity"
        >
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ background: '#E85D2F', color: '#0A0908', fontFamily: "'Fraunces', serif", fontWeight: 600, borderRadius: '2px' }}
          >
            ◆
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
            Sonant<span className="text-[#E85D2F]">.</span>
          </span>
        </Link>

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Account
        </div>

        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Welcome, <span className="italic">{profile?.full_name?.split(' ')[0] || 'composer'}</span>.
        </h1>

        <p className="text-base text-[#A8A39A] mb-12" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Your library is empty for now. Generate a brief, save it, and your work lives here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <InfoCard label="Email" value={user.email || ''} />
          <InfoCard label="Tier" value={profile?.tier === 'paid' ? 'Paid Membership' : 'Free Tier'} />
          <InfoCard label="Briefs This Month" value={`${profile?.briefs_generated_this_month || 0} of ${profile?.tier === 'paid' ? 'unlimited' : '3'}`} />
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