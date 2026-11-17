'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggestedDiscoFilename } from '@/lib/verification';
import { UploadRequestError, postJson } from '@/lib/upload-client';
import { btn, fieldLabel } from '@/components/ui';
import Modal, { ModalDone } from '@/components/Modal';
import { IconCheck } from '@/components/shell/icons';

type Props = {
  briefId: string;
  briefName: string;
  composerName: string;
  discoUrl: string | null;
  triggerClassName?: string;
  triggerLabel?: string;
};

export default function ClientBriefSubmitModal({
  briefId,
  briefName,
  composerName,
  discoUrl,
  triggerClassName,
  triggerLabel = 'Deliver on Disco',
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const filename = suggestedDiscoFilename(briefName, composerName);
  const canDeliver = !!discoUrl;

  function handleOpen() {
    setOpen(true);
    setError(null);
    setDone(false);
  }

  function handleClose() {
    if (logging) return;
    setOpen(false);
  }

  async function handleDeliver() {
    if (!discoUrl || logging) return;
    setLogging(true);
    setError(null);

    try {
      await postJson<{ url: string }>('/api/submissions/client-intent', { briefId });
      setDone(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof UploadRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not record the delivery.';
      setError(message);
      setDone(true);
    } finally {
      setLogging(false);
    }
  }

  async function copyFilename() {
    try {
      await navigator.clipboard.writeText(filename);
    } catch {
      // Clipboard can be blocked; the filename is still visible.
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={triggerClassName ?? btn('accent', 'md')}>
        {triggerLabel}
      </button>

      {open && (
        <Modal
          title={done ? undefined : 'Deliver on Disco'}
          subtitle={briefName}
          onClose={handleClose}
          locked={logging}
          footer={
            done ? undefined : (
              <>
                <a
                  href={discoUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDeliver}
                  aria-disabled={!canDeliver || logging}
                  className={btn('accent', 'lg', `flex-1 ${!canDeliver || logging ? 'opacity-40 pointer-events-none' : ''}`)}
                >
                  {logging ? 'Opening…' : 'Open Disco'}
                </a>
                <button type="button" onClick={handleClose} disabled={logging} className={btn('secondary', 'lg')}>
                  Cancel
                </button>
              </>
            )
          }
        >
          {done ? (
            <ModalDone
              icon={<IconCheck size={20} strokeWidth={2} />}
              title="Disco is open"
              body={
                <>
                  Deliver the WAV there. Name the file <span className="text-[var(--text-primary)]">{filename}</span> so we can
                  match it to you.
                </>
              }
              actions={
                <>
                  {discoUrl && (
                    <a href={discoUrl} target="_blank" rel="noopener noreferrer" className={btn('primary', 'md')}>
                      Open inbox
                    </a>
                  )}
                  <button type="button" onClick={() => setOpen(false)} className={btn('secondary', 'md')}>
                    Done
                  </button>
                </>
              }
            />
          ) : (
            <div className="px-6 py-6 flex flex-col gap-5">
              <div>
                <p className={fieldLabel}>Name your file</p>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] pl-3.5 pr-1.5 h-11">
                  <span className="text-[13px] truncate flex-1 tabular-nums">{filename}</span>
                  <button type="button" onClick={copyFilename} className={btn('secondary', 'sm')}>
                    Copy
                  </button>
                </div>
                <p className="mt-1.5 text-[12px] text-[var(--text-dim)]">WAV · no credit used · send as many takes as you like</p>
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-[var(--danger)]">
                  {error}
                </p>
              )}

              {!canDeliver && (
                <p className="rounded-xl bg-[var(--warning-soft)] px-4 py-3 text-[13px] text-[var(--warning)] leading-relaxed">
                  This brief does not have a Disco inbox yet. Email hello@thoughtcollective.com.
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
