import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div
          className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Verification link expired
        </div>

        <h2
          className="text-4xl mb-6 leading-tight"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Let&apos;s try that <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>again</span>.
        </h2>

        <p className="text-base text-[#A8A39A] mb-10 leading-relaxed">
          The email confirmation link expired or was already used. Sign in to your account, or sign up again to receive a fresh link.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase text-center transition-all"
            style={{
              background: '#E85D2F',
              color: '#0A0908',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              borderRadius: '2px',
            }}
          >
            ◆ Sign In
          </Link>
          <Link
            href="/signup"
            className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase text-center border border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              borderRadius: '2px',
            }}
          >
            Sign Up Again
          </Link>
        </div>

        <p
          className="text-xs text-[#6A6660] text-center pt-8"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Trouble?{' '}
          <Link
            href="/"
            className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}