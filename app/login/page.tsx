'use client';

import { useState, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  const redirectTo = searchParams.get('redirect') ?? '/browse';

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
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Welcome Back
        </div>

        <h1 className="text-4xl md:text-5xl tracking-tight leading-tight mb-3" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Sign <span className="italic">in</span>.
        </h1>

        <p className="text-sm text-[var(--text-tertiary)] mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          The Generator, the Library, and the Catalog. Pick up where you left off.
        </p>

        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />

          {error && (
            <div className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3" style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <SubmitButton submitting={submitting} />

          <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don&apos;t have an account?{' '}
            <Link href={`/signup${redirectTo !== '/browse' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
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
      className={`w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase transition-all mt-2 ${
        submitting
          ? 'bg-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
          : 'bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D]'
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
    >
      {submitting ? '◆ Signing In…' : '◆ Sign In'}
    </button>
  );
}
function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
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
        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors"
        style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
      />
    </div>
  );
}