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
          className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)] mb-4"
          style={{ fontFamily: "var(--brand-mono)" }}
        >
          Account
        </div>

        <h1
          className="text-4xl md:text-5xl tracking-tight leading-tight mb-3"
          style={{ fontFamily: "var(--brand-display)", fontWeight: 300 }}
        >
          Reset your <span className="italic">password.</span>
        </h1>

        {sent ? (
          <div
            className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-6 mt-8"
            style={{ borderRadius: '2px' }}
          >
            <p className="text-base leading-relaxed" style={{ fontFamily: "var(--brand-sans)" }}>
              If that email has an account, we sent a reset link. It expires in about an hour.
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-4" style={{ fontFamily: "var(--brand-sans)" }}>
              <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-tertiary)] mb-10" style={{ fontFamily: "var(--brand-sans)" }}>
              Enter the email on your account and we will send a one-time reset link.
            </p>

            <form action={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
                  style={{ fontFamily: "var(--brand-mono)" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  style={{ fontFamily: "var(--brand-sans)", borderRadius: '2px' }}
                />
              </div>

              {error && (
                <div
                  className="text-sm text-[var(--danger)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3"
                  style={{ borderRadius: '2px', fontFamily: "var(--brand-sans)" }}
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
                    : 'bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent-hover)]'
                }`}
                style={{ fontFamily: "var(--brand-mono)", borderRadius: '2px', fontWeight: 500 }}
              >
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </button>

              <p className="text-xs text-[var(--text-dim)] text-center pt-2" style={{ fontFamily: "var(--brand-sans)" }}>
                <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
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
