'use client';

import Link from 'next/link';

interface Props {
  name: string;
  email: string;
  memberSince: string;
  signOutAction: () => Promise<void>;
}

export default function BusinessDashboard({ name, email, memberSince, signOutAction }: Props) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pt-16 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-16 pb-8 border-b border-[var(--border-base)]">
          <div className="flex items-center gap-5">
            <div
              className="w-12 h-12 flex items-center justify-center text-sm font-medium text-white shrink-0"
              style={{ background: '#E85D2F', borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg tracking-tight text-[var(--text-primary)]"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
                  {name}
                </span>
                <span
                  className="text-[9px] tracking-[0.25em] uppercase px-2 py-0.5 border border-[#E85D2F]/40 text-[#E85D2F]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Business
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {email} · Member since {memberSince}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          <Link
            href="/generator"
            className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-all p-8 group"
            style={{ borderRadius: '2px' }}
          >
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Post a Brief
            </div>
            <h3 className="text-xl tracking-tight mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Need music for a <span className="italic">project?</span>
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Write a brief using our generator. Your brief goes live on the platform and composers write directly to your spec. Pre-vetted submissions only. No inbox noise.
            </p>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] group-hover:translate-x-1 transition-transform"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Open generator →
            </div>
          </Link>

          <a
            href="https://sonant.ac"
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[#E85D2F] hover:bg-[var(--bg-card-hover)] transition-all p-8 group"
            style={{ borderRadius: '2px' }}
          >
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ The Catalog
            </div>
            <h3 className="text-xl tracking-tight mb-3 text-[var(--text-primary)]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Browse pre-vetted <span className="italic">tracks.</span>
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The Sonant catalog. Every track individually reviewed, curated to brief, and cleared for sync. Filter by genre, mood, and project type.
            </p>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] group-hover:translate-x-1 transition-transform"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Browse catalog →
            </div>
          </a>
        </div>

        {/* Posted briefs */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--border-base)]">
            <h2 className="text-base tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              Your Client Briefs
            </h2>
            <Link
              href="/generator"
              className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-75 transition-opacity"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              + Post a Brief
            </Link>
          </div>

          <div className="py-16 text-center border border-dashed border-[var(--border-base)]" style={{ borderRadius: '2px' }}>
            <p className="text-sm text-[var(--text-muted)] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No client briefs posted yet.
            </p>
            <Link
              href="/generator"
              className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ◆ Post Your First Brief
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
