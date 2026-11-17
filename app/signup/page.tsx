'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { btn, fieldLabel, inputClass } from '@/components/ui';
import AuthCard, { AuthError } from '@/components/AuthCard';
import { useSearchParams } from 'next/navigation';
import { signUp } from '@/app/auth/actions';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const referredBy = searchParams.get('ref') ?? '';
  const signupNext = searchParams.get('redirect') ?? '';
  const invited = referredBy.length > 0;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    formData.set('accountType', 'composer');
    if (referredBy) formData.set('referredBy', referredBy);
    if (signupNext) formData.set('signupNext', signupNext);
    const result = await signUp(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Check your email"
        description="Click the link we sent to finish signing up."
      >
        <Link href="/briefs" className={btn('secondary', 'lg', 'w-full')}>
          Browse briefs while you wait
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={invited ? 'You were sent a brief' : 'Write for Thought Collective'}
      description={
        invited
          ? 'Create a free account to open it and submit your track.'
          : 'Write to our briefs. The best tracks join our catalogue. Free to join.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--text-primary)] hover:text-[var(--signal)] transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form action={handleSubmit} className="flex flex-col gap-4">
        {referredBy && <input type="hidden" name="referredBy" value={referredBy} />}
        {signupNext && <input type="hidden" name="signupNext" value={signupNext} />}
        <Field label="Full name" name="fullName" type="text" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={submitting} className={btn('primary', 'lg', 'w-full mt-1')}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}

function Field({ label, name, type, required, minLength, autoComplete, hint }: {
  label: string; name: string; type: string; required?: boolean; minLength?: number; autoComplete?: string; hint?: string
}) {
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
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${inputClass} h-11`}
      />
      {hint && <p className="mt-1.5 text-[12px] text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}
