'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import PlayPauseIcon from '@/components/PlayPauseIcon';
import SubmitUploadModal from '@/components/SubmitUploadModal';
import SubmissionHistory, {
  SUBMISSION_STATUS,
  type SubmissionItem,
} from '@/components/SubmissionHistory';
import { BRIEF_KIND_LABEL, type BriefKind } from '@/lib/brief-kind';
import { THOUGHT_COLLECTIVE_CATALOG } from '@/lib/partners';

export type CatalogUpload = {
  id: string;
  fileName: string;
  fileUrl: string;
  briefId: string;
  briefName: string;
  kind: BriefKind;
  createdAt: string;
  submitted: boolean;
  submissionStatus: string | null;
};

type Tab = 'uploads' | 'submissions';

function tabFromSearch(value: string | null): Tab {
  return value === 'submissions' ? 'submissions' : 'uploads';
}

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

const KIND_STYLE: Record<BriefKind, { color: string; bg: string; border: string }> = {
  catalog: { color: '#E85D2F', bg: '#E85D2F15', border: '#E85D2F30' },
  client: { color: '#92A8D1', bg: '#92A8D115', border: '#92A8D130' },
  community: { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border-card)' },
};

function KindTag({ kind }: { kind: BriefKind }) {
  const style = KIND_STYLE[kind];
  return (
    <span
      className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5"
      style={{
        ...mono,
        borderRadius: '2px',
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      {BRIEF_KIND_LABEL[kind]}
    </span>
  );
}

function displayTrackName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '');
}

export default function CatalogClient({
  uploads,
  submissions,
  loggedIn,
  submissionCredits = 0,
  isAdmin = false,
}: {
  uploads: CatalogUpload[];
  submissions: SubmissionItem[];
  loggedIn: boolean;
  submissionCredits?: number;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromSearch(searchParams.get('tab')));
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();

  useEffect(() => {
    setActiveTab(tabFromSearch(searchParams.get('tab')));
  }, [searchParams]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'uploads', label: 'My Uploads' },
    { key: 'submissions', label: 'My Submissions' },
  ];

  return (
    <>
      <div className="mb-10 max-w-2xl">
        <h1
          className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4"
          style={{ ...serif, fontWeight: 300 }}
        >
          Catalog.
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={sans}>
          Your uploads and submissions. Thought Collective is our partner for pitching accepted tracks for sync licensing opportunities.
        </p>
        <a
          href={THOUGHT_COLLECTIVE_CATALOG}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
          style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
        >
          ◆ Thought Collective catalog
        </a>
      </div>

      <div className="flex items-end mb-8 border-b border-[var(--border-base)]">
        <div className="flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-xs tracking-[0.2em] uppercase transition-colors -mb-px border-b-2 ${
                activeTab === key
                  ? 'text-[var(--text-primary)] border-[#E85D2F]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
              }`}
              style={mono}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'uploads' && (
        <>
          <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed mb-8" style={sans}>
            Every take you have attached to a brief. Listen here. Uploads on catalog briefs can be submitted with a credit.
          </p>

          {!loggedIn ? (
            <SignInCard />
          ) : uploads.length === 0 ? (
            <EmptyCard
              title="No uploads yet."
              body="Write to a brief and upload a take. It shows up here, tagged by community, catalog, or client."
            />
          ) : (
            <div className="border-t border-[var(--border-base)]">
              {uploads.map((item) => {
                const name = displayTrackName(item.fileName);
                const isActive = activeTrack?.url === item.fileUrl;
                const isCurrentlyPlaying = isActive && isPlaying;
                const status = item.submissionStatus
                  ? SUBMISSION_STATUS[item.submissionStatus] ?? { label: item.submissionStatus, color: 'var(--text-muted)' }
                  : null;

                return (
                  <div
                    key={item.id}
                    className="border-b border-[var(--border-base)] py-5 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isCurrentlyPlaying) pause();
                          else play({ url: item.fileUrl, fileName: item.fileName, briefId: item.briefId, briefName: item.briefName });
                        }}
                        className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors ${
                          isCurrentlyPlaying
                            ? 'bg-[#E85D2F] text-[#0A0908]'
                            : 'bg-[#0A0908] text-[#E85D2F]'
                        }`}
                        style={{ borderRadius: '2px' }}
                        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                      >
                        <PlayPauseIcon playing={isCurrentlyPlaying} size={11} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg text-[var(--text-primary)] truncate" style={{ ...serif, fontWeight: 400 }}>
                            {name}
                          </span>
                          <KindTag kind={item.kind} />
                        </div>
                        <Link
                          href={`/briefs/${item.briefId}`}
                          className="text-[10px] tracking-[0.12em] uppercase text-[var(--text-dimmer)] hover:text-[#E85D2F] transition-colors truncate block"
                          style={mono}
                        >
                          {item.briefName}
                        </Link>
                      </div>
                    </div>

                    <div className="shrink-0 md:ml-auto flex items-center justify-end">
                      {item.kind === 'catalog' && !item.submitted && (
                        <SubmitUploadModal
                          trackId={item.id}
                          trackName={name}
                          briefName={item.briefName}
                          submissionCredits={submissionCredits}
                          isAdmin={isAdmin}
                        />
                      )}
                      {item.kind === 'catalog' && item.submitted && status && (
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ ...mono, color: status.color }}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'submissions' && (
        <>
          <p className="text-sm text-[var(--text-tertiary)] max-w-xl leading-relaxed mb-8" style={sans}>
            Status and written notes on tracks you have sent in. Accepted catalog tracks are the ones Thought Collective pitches.
          </p>
          {loggedIn ? (
            <SubmissionHistory items={submissions} />
          ) : (
            <SignInCard />
          )}
        </>
      )}
    </>
  );
}

function SignInCard() {
  return (
    <div
      className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
      style={{ borderRadius: '2px' }}
    >
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
        Sign in to see the tracks you have uploaded, their status, and any written feedback.
      </p>
      <Link
        href="/login?redirect=/catalog"
        className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        ◆ Sign In
      </Link>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="border border-[var(--border-card)] bg-[var(--bg-card)] p-10 md:p-12"
      style={{ borderRadius: '2px' }}
    >
      <h3 className="text-2xl tracking-tight mb-4" style={{ ...serif, fontWeight: 300 }}>
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-md" style={sans}>
        {body}
      </p>
      <Link
        href="/briefs"
        className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        ◆ Open Briefs
      </Link>
    </div>
  );
}
