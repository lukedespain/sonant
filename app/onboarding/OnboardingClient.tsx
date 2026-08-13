'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingClient() {
  const router = useRouter();
  const [saving, setSaving] = useState<'composer' | 'business' | null>(null);

  async function select(type: 'composer' | 'business') {
    setSaving(type);
    await fetch('/api/profile/set-account-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_type: type }),
    });
    router.push(type === 'composer' ? '/browse' : '/account');
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16 min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-2xl">

        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ You&apos;re in
        </div>

        <h1 className="text-4xl md:text-5xl tracking-tight leading-[1.1] mb-4"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          One quick <span className="italic">thing.</span>
        </h1>

        <p className="text-base text-[var(--text-tertiary)] mb-12 max-w-md leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Tell us how you&apos;re using Sonant. We&apos;ll shape your experience around it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Composer card */}
          <button
            onClick={() => select('composer')}
            disabled={saving !== null}
            className="text-left border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-all p-8 group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '2px' }}
          >
            <div className="text-2xl mb-5 text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif" }}>♩</div>
            <div className="text-lg tracking-tight mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              I make <span className="italic">music.</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Composers, producers, musicians. Write to briefs, get written feedback on every submission, and build toward a spot in the Sonant catalog.
            </p>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] group-hover:translate-x-1 transition-transform"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {saving === 'composer' ? '◆ Setting up…' : '◆ Continue as music creator →'}
            </div>
          </button>

          {/* Business card */}
          <button
            onClick={() => select('business')}
            disabled={saving !== null}
            className="text-left border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-all p-8 group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '2px' }}
          >
            <div className="text-2xl mb-5 text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif" }}>◈</div>
            <div className="text-lg tracking-tight mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              I need <span className="italic">music.</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Brands, music supervisors, studios, and filmmakers. Post briefs, receive pre-vetted submissions, and find exactly what your project needs.
            </p>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] group-hover:translate-x-1 transition-transform"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {saving === 'business' ? '◆ Setting up…' : '◆ Continue as music buyer →'}
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
