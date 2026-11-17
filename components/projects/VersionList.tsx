'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import PlayPauseIcon from '@/components/PlayPauseIcon';
import { StatusPill, btn } from '@/components/ui';
import { composerStatus } from '@/components/SubmissionHistory';
import { IconDownload } from '@/components/shell/icons';
import type { ProjectVersion } from '@/lib/projects';

function when(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' · ' +
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const ACTIONS: { status: string; label: string }[] = [
  { status: 'sent_to_catalog', label: 'Sent to client' },
  { status: 'accepted', label: 'Client picked it' },
  { status: 'not_accepted', label: 'Not picked' },
  { status: 'received', label: 'Back to review' },
];

export default function VersionList({
  projectId,
  projectName,
  versions,
  admin = false,
  emptyText,
}: {
  projectId: string;
  projectName: string;
  versions: ProjectVersion[];
  admin?: boolean;
  emptyText: string;
}) {
  const router = useRouter();
  const { track, isPlaying, play, pause } = useAudioPlayer();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(submissionId: string, status: string) {
    setBusy(submissionId);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, status }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Could not update that version.');
      return;
    }
    router.refresh();
  }

  if (versions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-5 py-8 text-center text-[14px] text-[var(--text-dim)]">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
      {versions.map((v, i) => {
        const playing = !!v.audioUrl && track?.url === v.audioUrl && isPlaying;
        const s = composerStatus({ status: v.status, briefType: 'client' });
        return (
          <div key={v.id} className="px-4 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              disabled={!v.audioUrl}
              onClick={() =>
                playing ? pause() : v.audioUrl && play({ url: v.audioUrl, fileName: v.trackName, briefId: projectId, briefName: projectName })
              }
              aria-label={playing ? 'Pause' : `Play ${v.trackName}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 ${
                playing
                  ? 'bg-[var(--signal)] text-[#0A0A0A]'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
              }`}
            >
              <PlayPauseIcon playing={playing} size={11} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium truncate">
                {v.trackName}
                {i === 0 && <span className="ml-2 text-[12px] font-normal text-[var(--signal)]">Latest</span>}
              </p>
              <p className="text-[12px] text-[var(--text-dim)] tabular-nums" suppressHydrationWarning>
                {when(v.createdAt)}
              </p>
            </div>
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            {admin && (
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-1.5 sm:ml-2">
                {ACTIONS.filter((a) => a.status !== v.status && !(a.status === 'received' && v.status === 'pending')).map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    disabled={busy === v.id}
                    onClick={() => setStatus(v.id, a.status)}
                    className={btn(a.status === 'accepted' ? 'accent' : 'secondary', 'sm')}
                  >
                    {a.label}
                  </button>
                ))}
                {v.downloadHref && (
                  <a href={v.downloadHref} download className={btn('ghost', 'sm', 'px-2.5')} aria-label="Download">
                    <IconDownload size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="px-4 py-3 text-[13px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
