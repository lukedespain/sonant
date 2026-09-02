'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await requestPasswordReset(formData);
    setSubmitting(false);
    if (result?.error) setError(result.error);
    else setSent(true);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ◆ Account
        </div>

        <h1
          className="text-4xl md:text-5xl tracking-tight leading-tight mb-3"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Reset your <span className="italic">password.</span>
        </h1>

        {sent ? (
          <div
            className="border border-[#E85D2F]/40 bg-[#E85D2F]/5 p-6 mt-8"
            style={{ borderRadius: '2px' }}
          >
            <p className="text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              If that email is on Sonant, we sent a reset link. It expires in about an hour.
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <Link href="/login" className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-tertiary)] mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Enter the email on your account and we will send a one-time reset link.
            </p>

            <form action={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[#E85D2F] focus:outline-none transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                />
              </div>

              {error && (
                <div
                  className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3"
                  style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                >
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
                {submitting ? '◆ Sending…' : '◆ Send Reset Link'}
              </button>

              <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <Link href="/login" className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
