import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let sessionCredits = 0;
  let isPro = false;

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('session_credits, tier')
      .eq('id', user.id)
      .single();

    sessionCredits = (profile as any)?.session_credits ?? 0;
    isPro = (profile as any)?.tier === 'pro' || (user.email?.endsWith('@sonant.ac') ?? false);
  }

  const canBook = !!user && sessionCredits > 0;

  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ 1:1 Feedback
            </div>

            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Get notes on<br />
              <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>your track.</span>
            </h1>

            <p className="text-base text-[var(--text-tertiary)] mb-6 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              A focused one-on-one session where we listen to your track together, compare it against the brief you wrote to, and give you specific notes in real time.
            </p>

            <p className="text-sm text-[var(--text-muted)] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Good for checking a track before submission, understanding why something isn&apos;t working, or getting a second ear on a mix you&apos;ve been staring at too long.
            </p>

            <div className="space-y-4 border-t border-[var(--border-base)] pt-8">
              {[
                { label: 'Session length', value: '45 minutes' },
                { label: 'Standard rate', value: '$50 / session' },
                { label: 'Pro member rate', value: '$25 / session' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {label}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Pick a time
            </div>

            {canBook ? (
              <div
                className="border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden"
                style={{ borderRadius: '2px' }}
              >
                <iframe
                  src="https://cal.com/sonant/feedback?embed=true&theme=light"
                  style={{ width: '100%', height: '660px', border: 'none' }}
                  title="Book a 1:1 feedback session"
                />
              </div>
            ) : (
              <div
                className="border border-[var(--border-card)] bg-[var(--bg-card)] p-8 flex flex-col justify-center"
                style={{ borderRadius: '2px', minHeight: '300px' }}
              >
                {!user ? (
                  <>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Sign in to book
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      You need an account to book a session. Sessions are available to purchase from your dashboard.
                    </p>
                    <Link
                      href="/login?redirect=/feedback"
                      className="inline-block px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors w-fit"
                      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                    >
                      ◆ Sign In
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      No sessions available
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      You don&apos;t have any session credits. {isPro ? 'Purchase a session from your dashboard.' : 'Go Pro to get a free welcome session, or purchase one directly.'}
                    </p>
                    <Link
                      href="/account"
                      className="inline-block px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors w-fit"
                      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
                    >
                      ◆ Go to Dashboard
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
