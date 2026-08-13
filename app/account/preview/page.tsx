import { notFound } from 'next/navigation';
import AccountClient from '../AccountClient';

export default function AccountPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  async function noopSignOut() {
    'use server';
  }

  const mockSubmissions = [
    { id: '1', briefId: 'b1', briefCodename: 'Project Ember', status: 'feedback_ready', feedback: 'Great work on the low end. The mids need some clarity around 2kHz. Overall, the brief match is strong. Cinematic arc tracks well.', createdAt: '2026-05-10T00:00:00Z' },
    { id: '2', briefId: 'b2', briefCodename: 'Project Veil', status: 'received', feedback: null, createdAt: '2026-06-01T00:00:00Z' },
  ];

  const mockBriefs = [
    { id: 'b1', mode: 'brand', target: 'Automotive', genres: ['Electronic', 'Ambient'], moods: ['Cinematic', 'Tense'], generated_content: { codename: 'Ember', project: 'A high-energy brand campaign for a premium automotive launch' }, created_at: '2026-04-20T00:00:00Z' },
    { id: 'b2', mode: 'film', target: 'Drama', genres: ['Orchestral'], moods: ['Melancholic'], generated_content: { codename: 'Veil', project: 'Score for an indie drama short' }, created_at: '2026-05-02T00:00:00Z' },
  ];

  const mockTracks = [
    { id: 't1', briefId: 'b1', briefCodename: 'Ember', fileName: 'ember_v2_final.wav', fileUrl: '', createdAt: '2026-04-25T00:00:00Z' },
  ];

  return (
    <div className="pt-16 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10 space-y-24">

        {/* Beta user — 0 credits */}
        <section>
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-8 pb-3 border-b border-[var(--border-base)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preview: Beta · 0 credits
          </div>
          <AccountClient
            userId="preview-beta-0"
            initialName="Preview User"
            initialAvatarUrl={null}
            email="preview@example.com"
            memberSince="May 6, 2026"
            submissionCredits={0}
            sessionCredits={0}
            generatedBriefs={[]}
            uploadedTracks={[]}
            catalogSubmissions={[]}
            signOutAction={noopSignOut}
          />
        </section>

        {/* Beta user — with data */}
        <section>
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-dimmer)] mb-8 pb-3 border-b border-[var(--border-base)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Preview: Beta · 1 submission credit · 1 session · with data
          </div>
          <AccountClient
            userId="preview-beta-data"
            initialName="Alex Chen"
            initialAvatarUrl={null}
            email="alex@example.com"
            memberSince="April 20, 2026"
            submissionCredits={1}
            sessionCredits={1}
            generatedBriefs={mockBriefs as any[]}
            uploadedTracks={mockTracks}
            catalogSubmissions={mockSubmissions}
            signOutAction={noopSignOut}
          />
        </section>

      </div>
    </div>
  );
}
