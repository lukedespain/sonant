'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updatePassword } from '@/app/auth/actions';

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await updatePassword(formData);
    setSubmitting(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div
          className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)] mb-4"
          style={{ fontFamily: "var(--brand-mono)" }}
        >
          ◆ Account
        </div>

        <h1
          className="text-4xl md:text-5xl tracking-tight leading-tight mb-3"
          style={{ fontFamily: "var(--brand-display)", fontWeight: 300 }}
        >
          Choose a new <span className="italic">password.</span>
        </h1>

        <p className="text-sm text-[var(--text-tertiary)] mb-10" style={{ fontFamily: "var(--brand-sans)" }}>
          At least 8 characters. You will be signed in after this.
        </p>

        <form action={handleSubmit} className="space-y-5">
          <Field label="New password" name="password" type="password" />
          <Field label="Confirm password" name="confirm" type="password" />

          {error && (
            <div
              className="text-sm text-[var(--danger)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3"
              style={{ borderRadius: '2px', fontFamily: "var(--brand-sans)" }}
            >
              {error}
              {error.includes('invalid or expired') && (
                <div className="mt-2">
                  <Link href="/forgot-password" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                    Request a new link
                  </Link>
                </div>
              )}
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
            {submitting ? '◆ Saving…' : '◆ Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-2"
        style={{ fontFamily: "var(--brand-mono)" }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        minLength={8}
        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        style={{ fontFamily: "var(--brand-sans)", borderRadius: '2px' }}
      />
    </div>
  );
}
