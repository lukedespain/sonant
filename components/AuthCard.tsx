import type { ReactNode } from 'react';
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark';

/** Centred card for sign in, sign up, and password pages. */
export default function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-5 py-14 md:py-20">
      <div className="w-full max-w-[420px] animate-rise">
        <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-7 md:p-9 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]">
          <div className="w-11 h-11 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
            <ThoughtCollectiveMark size={20} />
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] leading-tight">{title}</h1>
          {description && <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed">{description}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-[13px] text-[var(--text-muted)]">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger)] leading-relaxed">
      {children}
    </div>
  );
}
