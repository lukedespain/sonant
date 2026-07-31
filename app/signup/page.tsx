'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/app/auth/actions';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/browse';

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await signUp(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Create Account
        </div>

        <h1 className="text-4xl md:text-5xl tracking-tight leading-tight mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Join the <span className="italic">catalog.</span>
        </h1>

        <p className="text-sm text-[var(--text-tertiary)] mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Write to professional-style briefs, get written feedback, and earn a spot in the Sonant catalog. One free submission per month.
        </p>

        {success ? (
          <div className="border border-[#E85D2F]/40 bg-[#E85D2F]/5 p-6" style={{ borderRadius: '2px' }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Check your email
            </div>
            <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              We sent a confirmation link to verify your account. Click it and you&apos;ll be taken straight to the briefs.
            </p>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-5">
            <Field label="Full Name" name="fullName" type="text" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Password" name="password" type="password" required minLength={8} />

            {error && (
              <div className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3" style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase transition-all mt-2 ${
                submitting
                  ? 'bg-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
                  : 'bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D]'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              {submitting ? '◆ Creating Account…' : '◆ Create Account'}
            </button>

            <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Already have an account?{' '}
              <Link href={`/login${redirectTo !== '/browse' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, type, required, minLength }: { label: string; name: string; type: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors"
        style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
      />
    </div>
  );
}