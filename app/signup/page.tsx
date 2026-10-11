'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { btn } from '@/components/ui';
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
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="border border-[#E85D2F]/40 bg-[#E85D2F]/5 p-6" style={{ borderRadius: '2px' }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Check your email
            </div>
            <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              We sent a confirmation link to verify your account. Click it and you&apos;ll be taken straight to the briefs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="label text-[var(--accent)] mb-4">◆ Free account</p>

        <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight leading-tight mb-3">
          Start writing to <span className="italic">briefs.</span>
        </h1>

        <p className="text-[15px] text-[var(--text-tertiary)] leading-relaxed mb-10">
          {invited
            ? 'A composer shared a brief with you. Create a free account to view it, save work, and submit from Briefs. One submission credit each month.'
            : 'Write to real briefs, get written feedback on every submission, and get your best tracks into catalogs. One free submission credit every month.'}
        </p>

        <form action={handleSubmit} className="space-y-5">
          {referredBy && <input type="hidden" name="referredBy" value={referredBy} />}
          {signupNext && <input type="hidden" name="signupNext" value={signupNext} />}
          <Field label="Full name" name="fullName" type="text" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />

          {error && (
            <div className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3"
              style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={btn('primary', 'md', 'w-full h-12 mt-2')}
          >
            {submitting ? '◆ Creating account…' : '◆ Create account'}
          </button>

          <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Already have an account?{' '}
            <Link href="/login" className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type, required, minLength, autoComplete, hint }: {
  label: string; name: string; type: string; required?: boolean; minLength?: number; autoComplete?: string; hint?: string
}) {
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
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full h-12 px-4 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-[2px] focus:border-[var(--accent)] focus:outline-none transition-colors"
      />
      {hint && <p className="mt-1.5 text-xs text-[var(--text-dimmer)]">{hint}</p>}
    </div>
  );
}
