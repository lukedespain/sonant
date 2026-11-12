import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div
          className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-4"
          style={{ fontFamily: "var(--brand-mono)" }}
        >
          Verification link expired
        </div>

        <h2
          className="text-4xl mb-6 leading-tight"
          style={{ fontFamily: "var(--brand-display)", fontWeight: 300 }}
        >
          Let&apos;s try that <span className="italic text-[var(--accent)]" style={{ fontWeight: 400 }}>again</span>.
        </h2>

        <p className="text-base text-[var(--text-tertiary)] mb-10 leading-relaxed">
          The email confirmation or password reset link expired or was already used. Sign in, request a new reset, or sign up again.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase text-center transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-base)',
              fontFamily: "var(--brand-mono)",
              fontWeight: 500,
              borderRadius: '2px',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/forgot-password"
            className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase text-center border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            style={{
              fontFamily: "var(--brand-mono)",
              fontWeight: 500,
              borderRadius: '2px',
            }}
          >
            Forgot Password
          </Link>
          <Link
            href="/signup"
            className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase text-center border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            style={{
              fontFamily: "var(--brand-mono)",
              fontWeight: 500,
              borderRadius: '2px',
            }}
          >
            Sign Up Again
          </Link>
        </div>

        <p
          className="text-xs text-[var(--text-dim)] text-center pt-8"
          style={{ fontFamily: "var(--brand-sans)" }}
        >
          Trouble?{' '}
          <Link
            href="/"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}