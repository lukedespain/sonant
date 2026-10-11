'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { btn } from '@/components/ui';
import { signIn } from '@/app/auth/actions';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/briefs';

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await signIn(formData);
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="label text-[var(--accent)] mb-4">◆ Welcome back</p>

        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight leading-tight mb-3">
          Sign <span className="italic">in</span>.
        </h1>

        <p className="text-[15px] text-[var(--text-tertiary)] mb-10">
          Pick up where you left off.
        </p>

        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <div>
            <Field label="Password" name="password" type="password" required autoComplete="current-password" />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3" style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <SubmitButton submitting={submitting} />

          <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don&apos;t have an account?{' '}
            <Link href={`/signup${redirectTo !== '/briefs' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={btn('primary', 'md', 'w-full h-12 mt-2')}
    >
      {submitting ? '◆ Signing in…' : '◆ Sign in'}
    </button>
  );
}
function Field({ label, name, type, required, autoComplete }: { label: string; name: string; type: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block label text-[var(--text-muted)] mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full h-12 px-4 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors"
      />
    </div>
  );
}