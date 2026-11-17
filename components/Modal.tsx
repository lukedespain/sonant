'use client';

import { useEffect, type ReactNode } from 'react';
import { IconClose } from '@/components/shell/icons';

/** Centred dialog on desktop, bottom sheet on phones. */
export default function Modal({
  title,
  subtitle,
  onClose,
  locked = false,
  children,
  footer,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  /** Ignore Escape and backdrop clicks (while uploading or sending). */
  locked?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [locked, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/75 animate-fade"
      onClick={() => !locked && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-[460px] max-h-[92vh] flex flex-col bg-[var(--bg-sidebar)] border border-[var(--border-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-5 border-b border-[var(--border-base)] flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[13px] text-[var(--text-muted)] truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={locked}
              aria-label="Close"
              className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] disabled:opacity-40"
            >
              <IconClose size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto app-scroll">{children}</div>
        {footer && <div className="px-6 pb-6 pt-1 flex gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

/** Success state used inside a Modal. */
export function ModalDone({ icon, title, body, actions }: { icon: ReactNode; title: string; body: ReactNode; actions: ReactNode }) {
  return (
    <div className="text-center px-8 py-12">
      <div className="mx-auto w-12 h-12 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">{body}</div>
      <div className="mt-8 flex gap-2 justify-center">{actions}</div>
    </div>
  );
}
