'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordDecision, type SubmissionDecision } from '@/app/briefs/actions';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import PlayPauseIcon from '@/components/PlayPauseIcon';
import { StatusPill, btn, textareaClass, type Tone } from '@/components/ui';
import { IconArrowUpRight, IconChevronRight, IconDownload } from '@/components/shell/icons';
import { CATALOG_PARTNER_LIST, catalogPartnerById } from '@/lib/partners';
import TagPicker from '@/components/TagPicker';
import Link from 'next/link';

export type AdminHandoff = {
  agreedAt: string | null;
  stemsUrl: string | null;
  noStems: boolean;
  humanMade: boolean;
  rights: {
    legalName: string;
    pro: string;
    composerIpi: string;
    publisherName: string;
    publisherIpi: string;
  } | null;
};

type AdminSubmissionCardProps = {
  submissionId: string;
  briefId: string;
  projectName: string;
  composerEmail: string;
  status: string;
  existingFeedback: string | null;
  submittedAt: string;
  briefType?: 'client' | 'catalog';
  delivery?: 'upload' | 'disco';
  discoInboxUrl?: string | null;
  deliveryConfirmedAt?: string | null;
  audioUrl?: string | null;
  audioName?: string | null;
  downloadHref?: string | null;
  playlistHref?: string | null;
  catalogId?: string;
  handoff?: AdminHandoff | null;
  briefGenres?: string[];
  briefMoods?: string[];
  savedTags?: { genres: string[]; moods: string[] } | null;
};

export default function AdminSubmissionCard({
  submissionId,
  briefId,
  projectName,
  composerEmail,
  status,
  existingFeedback,
  submittedAt,
  briefType = 'catalog',
  delivery = 'upload',
  discoInboxUrl = null,
  deliveryConfirmedAt = null,
  audioUrl = null,
  audioName = null,
  downloadHref = null,
  playlistHref = null,
  catalogId = 'sonant',
  handoff = null,
  briefGenres = [],
  briefMoods = [],
  savedTags = null,
}: AdminSubmissionCardProps) {
  const router = useRouter();
  const { track: activeTrack, isPlaying, play, pause } = useAudioPlayer();
  const isDisco = delivery === 'disco';
  const isDecided = status === 'accepted' || status === 'not_accepted';
  const isSent = status === 'sent_to_catalog';
  const catalogName = catalogPartnerById(catalogId)?.name ?? 'Sonant';
  const [selectedCatalog, setSelectedCatalog] = useState(catalogId);
  const selectedName = catalogPartnerById(selectedCatalog)?.name ?? 'Sonant';
  const canSend = selectedCatalog !== 'sonant';
  const [open, setOpen] = useState(isDisco ? !deliveryConfirmedAt : !isDecided && !isSent);
  const [feedback, setFeedback] = useState(existingFeedback ?? '');
  // Starts with everything on the brief ticked; untick what the track does not nail.
  const [tags, setTags] = useState(savedTags ?? { genres: briefGenres, moods: briefMoods });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: SubmissionDecision) {
    if (!feedback.trim()) {
      setError('Write your feedback on the track first.');
      return;
    }
    if (decision === 'accepted' && (tags.genres.length === 0 || tags.moods.length === 0)) {
      setError('Tag at least one genre and one mood this track nails.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await recordDecision({
      submissionId,
      decision,
      feedback,
      catalogId: selectedCatalog,
      tags: decision === 'accepted' ? tags : undefined,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelivered(confirmed: boolean) {
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/admin/submissions/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, confirmed }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Could not update delivery.');
      return;
    }
    router.refresh();
  }

  const isCurrentlyPlaying = !!audioUrl && activeTrack?.url === audioUrl && isPlaying;

  function handlePlay(event?: React.MouseEvent) {
    event?.stopPropagation();
    if (!audioUrl) return;
    if (isCurrentlyPlaying) pause();
    else play({ url: audioUrl, fileName: audioName || 'Submission', briefId, briefName: projectName });
  }

  const pill: { label: string; tone: Tone } = isDisco
    ? deliveryConfirmedAt
      ? { label: 'Delivered', tone: 'positive' }
      : { label: 'Clicked through', tone: 'warning' }
    : status_(status, isSent, catalogName, handoff);

  const [composerName, composerAddress] = composerEmail.includes(' · ')
    ? composerEmail.split(' · ')
    : ['', composerEmail];
  const trackTitle = audioName?.replace(/\.[^/.]+$/, '') || (isDisco ? 'Disco delivery' : 'Untitled track');

  return (
    <div
      className={`rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-colors ${
        open ? 'border-[var(--border-subtle)]' : 'border-[var(--border-card)]'
      }`}
    >
      <div className="flex items-center gap-3 md:gap-4 pl-3 pr-4 md:pl-4 py-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!audioUrl}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 ${
            isCurrentlyPlaying
              ? 'bg-[var(--signal)] text-[#0A0A0A]'
              : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
          }`}
          aria-label={isCurrentlyPlaying ? 'Pause' : 'Play submission'}
        >
          <PlayPauseIcon playing={isCurrentlyPlaying} size={11} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_100px_190px] gap-x-4 items-center text-left"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-medium truncate">{trackTitle}</span>
            <span className="block text-[12px] text-[var(--text-dim)] truncate">{composerName || composerAddress}</span>
          </span>
          <span className="hidden md:block min-w-0">
            <span className="block text-[14px] text-[var(--text-secondary)] truncate">{projectName}</span>
            <span className="block text-[12px] text-[var(--text-dim)]">
              {briefType === 'client' ? 'Client brief' : 'Catalogue brief'}
              {isDisco ? ' · Disco' : ''}
            </span>
          </span>
          <span className="hidden md:block text-[13px] text-[var(--text-muted)] tabular-nums">{submittedAt}</span>
          <span className="justify-self-end md:justify-self-start">
            <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
          </span>
        </button>
        <span
          className={`hidden sm:block text-[var(--text-dimmer)] transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          <IconChevronRight size={14} />
        </span>
      </div>

      {open && (
        <div className="border-t border-[var(--border-base)] grid lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="p-4 md:p-6 flex flex-col gap-5 min-w-0">
            {isDisco ? (
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                This is a click-through to Disco, not an uploaded file. Mark it delivered once you see the track in the inbox.
              </p>
            ) : (
              <>
                {handoff && <HandoffPanel handoff={handoff} catalogName={catalogName} />}

                <div>
                  <label htmlFor={`notes-${submissionId}`} className="block text-[13px] text-[var(--text-muted)] mb-1.5">
                    Your notes to the composer
                  </label>
                  <textarea
                    id={`notes-${submissionId}`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What works, what to change. Every email to the composer ends with this."
                    rows={5}
                    className={textareaClass}
                  />
                </div>

                {!isDecided && (
                  <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-base)] p-4">
                    <p className="text-[14px] font-medium">If it&apos;s accepted, what does it nail?</p>
                    <p className="mt-0.5 mb-3 text-[12px] text-[var(--text-dim)] leading-relaxed">
                      Untick what this track doesn&apos;t do, or add your own. The composer is verified for these on the roster. Only admins see them.
                    </p>
                    <TagPicker genreOptions={briefGenres} moodOptions={briefMoods} value={tags} onChange={setTags} />
                  </div>
                )}
                {status === 'accepted' && (
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {savedTags ? <>Verified for {[...savedTags.genres, ...savedTags.moods].join(' · ')}. </> : <>Not tagged yet. </>}
                    <Link href="/admin?tab=roster" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
                      Edit in Roster
                    </Link>
                  </p>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="text-[13px] text-[var(--danger)]">
                {error}
              </p>
            )}

            <div className="flex gap-2 flex-wrap items-center">
              {isDisco ? (
                deliveryConfirmedAt ? (
                  <button type="button" onClick={() => handleDelivered(false)} disabled={submitting} className={btn('secondary', 'md')}>
                    Undo delivered
                  </button>
                ) : (
                  <button type="button" onClick={() => handleDelivered(true)} disabled={submitting} className={btn('accent', 'md')}>
                    Mark delivered
                  </button>
                )
              ) : (
                <>
                  {canSend && (
                    <button
                      type="button"
                      onClick={() => handleDecision('sent_to_catalog')}
                      disabled={submitting}
                      className={btn(!isSent && !isDecided ? 'primary' : 'secondary', 'md')}
                    >
                      Send to {selectedName}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDecision('accepted')}
                    disabled={submitting}
                    className={btn(isSent || !canSend ? 'accent' : 'secondary', 'md')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('not_accepted')}
                    disabled={submitting}
                    className={btn('secondary', 'md', 'hover:!border-[var(--danger)] hover:!text-[var(--danger)]')}
                  >
                    Not this time
                  </button>
                  {(isDecided || isSent) && (
                    <span className="text-[12px] text-[var(--text-dimmer)]">Each change emails the composer</span>
                  )}
                </>
              )}
            </div>
            {!isDisco && !isDecided && (
              <p className="-mt-2 text-[12px] text-[var(--text-dim)] leading-relaxed">
                {isSent
                  ? `With ${catalogName}. Once they reply, mark it. Add their reason to the notes first if you have it.`
                  : canSend
                    ? `Send to ${selectedName} when it is worth pitching. The composer gets your notes either way.`
                    : 'You make the call. The composer gets your notes either way.'}
              </p>
            )}
          </div>

          <aside className="border-t lg:border-t-0 lg:border-l border-[var(--border-base)] p-4 md:p-6 flex flex-col gap-4 bg-[var(--bg-card-deep)]">
            <dl className="flex flex-col gap-3 text-[13px]">
              <div>
                <dt className="text-[var(--text-dim)]">Composer</dt>
                <dd className="mt-0.5 break-words">{composerName ? `${composerName}` : composerAddress}</dd>
                {composerName && <dd className="text-[var(--text-muted)] break-all">{composerAddress}</dd>}
              </div>
              <div>
                <dt className="text-[var(--text-dim)]">Brief</dt>
                <dd className="mt-0.5">{projectName}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-dim)]">Submitted</dt>
                <dd className="mt-0.5 tabular-nums">{submittedAt}</dd>
              </div>
            </dl>

            {!isDisco && !handoff?.agreedAt && (
              <label className="block">
                <span className="block text-[13px] text-[var(--text-dim)] mb-1.5">Catalogue</span>
                <select
                  value={selectedCatalog}
                  onChange={(e) => setSelectedCatalog(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-[13px] bg-[var(--bg-input)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl focus:border-[var(--signal-line)] focus:outline-none"
                >
                  {CATALOG_PARTNER_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedCatalog !== catalogId && (
                  <span className="mt-1 block text-[12px] text-[var(--text-dim)]">Brief was for {catalogName}</span>
                )}
              </label>
            )}

            <div className="flex flex-col gap-1.5">
              <a href={`/briefs/${briefId}`} target="_blank" rel="noopener noreferrer" className={btn('secondary', 'sm', 'justify-between')}>
                View brief <IconArrowUpRight size={12} />
              </a>
              {downloadHref && (
                <a href={downloadHref} download={audioName || true} className={btn('secondary', 'sm', 'justify-between')}>
                  Download track <IconDownload size={12} />
                </a>
              )}
              {isDisco && discoInboxUrl && (
                <a href={discoInboxUrl} target="_blank" rel="noopener noreferrer" className={btn('secondary', 'sm', 'justify-between')}>
                  Open Disco inbox <IconArrowUpRight size={12} />
                </a>
              )}
              {playlistHref && (
                <a href={playlistHref} target="_blank" rel="noopener noreferrer" className={btn('secondary', 'sm', 'justify-between')}>
                  Brief playlist <IconArrowUpRight size={12} />
                </a>
              )}
            </div>
            {!isDisco && !audioUrl && (
              <p className="text-[12px] text-[var(--text-dim)]">
                No audio on this submission.{playlistHref ? ' Open the brief playlist to hear their upload.' : ''}
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function status_(
  status: string,
  isSent: boolean,
  catalogName: string,
  handoff: AdminHandoff | null,
): { label: string; tone: Tone } {
  if (status === 'accepted') {
    if (handoff) return handoff.agreedAt ? { label: 'Accepted · signed', tone: 'positive' } : { label: 'Awaiting signature', tone: 'signal' };
    return { label: 'Accepted', tone: 'positive' };
  }
  if (status === 'not_accepted') return { label: 'Not accepted', tone: 'muted' };
  if (isSent) return { label: `With ${catalogName}`, tone: 'info' };
  return { label: 'To review', tone: 'warning' };
}

function HandoffPanel({ handoff, catalogName }: { handoff: AdminHandoff; catalogName: string }) {
  if (!handoff.agreedAt) {
    return (
      <div className="rounded-xl border border-[var(--signal-line)] bg-[var(--signal-soft)] px-4 py-3 text-[13px] text-[var(--signal)]">
        Waiting on the composer to sign on with {catalogName}.
      </div>
    );
  }
  const r = handoff.rights;
  const rows: [string, string][] = r
    ? [
        ['Legal name', r.legalName],
        ['PRO', r.pro],
        ['Composer IPI', r.composerIpi],
        ['Publisher', r.publisherName || 'None'],
        ['Publisher IPI', r.publisherIpi || 'None'],
        ['Human-made', handoff.humanMade ? 'Confirmed' : 'Not confirmed'],
        ['Stems', handoff.noStems ? 'None, full mix only' : 'Linked'],
      ]
    : [];
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-base)] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <StatusPill tone="positive">
          Signed {new Date(handoff.agreedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </StatusPill>
        <span className="text-[12px] text-[var(--text-dim)]">Ready for {catalogName}</span>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-1">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] text-[var(--text-dim)]">{k}</dt>
            <dd className="text-[13px] break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {handoff.stemsUrl && (
        <a href={handoff.stemsUrl} target="_blank" rel="noopener noreferrer" className={btn('secondary', 'sm', 'mt-3')}>
          Open stems <IconArrowUpRight size={12} />
        </a>
      )}
    </div>
  );
}
