'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { btn, fieldLabel, inputClass } from '@/components/ui';
import AuthCard, { AuthError } from '@/components/AuthCard';
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
    <AuthCard
      title="Welcome back"
      description="Sign in to track your submissions and pick up the next brief."
      footer={
        <>
          New here?{' '}
          <Link
            href={`/signup${redirectTo !== '/briefs' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-[var(--text-primary)] hover:text-[var(--signal)] transition-colors"
          >
            Create a free account
          </Link>
        </>
      }
    >
      <form action={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <div>
          <Field label="Password" name="password" type="password" required autoComplete="current-password" />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[13px] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        {error && <AuthError>{error}</AuthError>}

        <SubmitButton submitting={submitting} />
      </form>
    </AuthCard>
  );
}
function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={btn('primary', 'lg', 'w-full mt-1')}
    >
      {submitting ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
function Field({ label, name, type, required, autoComplete }: { label: string; name: string; type: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className={fieldLabel}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={`${inputClass} h-11`}
      />
    </div>
  );
}