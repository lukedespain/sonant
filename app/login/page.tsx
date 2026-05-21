'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { signIn } from '@/app/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

        <p className="text-sm text-[#A8A39A] mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Pick up where you left off.
        </p>

        <form action={handleSubmit} className="space-y-5">
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />

          {error && (
            <div className="text-sm text-[#FF8B6B] border border-[#FF8B6B]/30 bg-[#FF8B6B]/5 p-3" style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <SubmitButton />

          <p className="text-xs text-[#6A6660] text-center pt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#E85D2F] hover:text-[#FF6E3D] transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
function SubmitButton() {
  // useFormStatus reads the pending state of the parent <form>'s
  // action. It only works from a component rendered inside that form,
  // which is why the button lives in its own component. This reflects
  // the transition reliably, unlike a manual useState flag.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase transition-all mt-2 ${
        pending
          ? 'bg-[#1F1D1A] text-[#5A5650] cursor-not-allowed'
          : 'bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D]'
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
    >
      {pending ? '◆ Signing In…' : '◆ Sign In'}
    </button>
  );
}
function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] tracking-[0.25em] uppercase text-[#8A8680] mb-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 bg-[#141312] border border-[#2A2826] text-[#F5F1E8] focus:border-[#E85D2F] focus:outline-none transition-colors"
        style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
      />
    </div>
  );
}