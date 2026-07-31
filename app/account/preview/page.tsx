import { notFound } from 'next/navigation';
import AccountClient from '../AccountClient';

export default function AccountPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  async function noopSignOut() {
    'use server';
  }

  const sharedStats = { submissions: 4, featured: 1, uploads: 7, generations: 18 };

  return (
    <div className="pt-16 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10 space-y-24">

        {/* Free user — 0 credits */}
        <section>
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-8 pb-3 border-b border-[var(--border-base)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preview: Free · 0 credits
          </div>
          <AccountClient
            userId="preview-free-0"
            initialName="Preview User"
            initialAvatarUrl={null}
            email="preview@example.com"
            isPro={false}
            memberSince="May 6, 2026"
            submissionCredits={0}
            sessionCredits={0}
            stats={sharedStats}
            submissions={[]}
            signOutAction={noopSignOut}
          />
        </section>

        {/* Free user — 1 credit */}
        <section>
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-8 pb-3 border-b border-[var(--border-base)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preview: Free · 1 submission credit
          </div>
          <AccountClient
            userId="preview-free-1"
            initialName="Preview User"
            initialAvatarUrl={null}
            email="preview@example.com"
            isPro={false}
            memberSince="May 6, 2026"
            submissionCredits={1}
            sessionCredits={0}
            stats={sharedStats}
            submissions={[]}
            signOutAction={noopSignOut}
          />
        </section>

        {/* Pro user */}
        <section>
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-8 pb-3 border-b border-[var(--border-base)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preview: Pro · 3 credits · 1 session
          </div>
          <AccountClient
            userId="preview-pro"
            initialName="Pro User"
            initialAvatarUrl={null}
            email="pro@sonant.ac"
            isPro={true}
            memberSince="May 6, 2026"
            submissionCredits={3}
            sessionCredits={1}
            stats={sharedStats}
            submissions={[]}
            signOutAction={noopSignOut}
          />
        </section>

      </div>
    </div>
  );
}
