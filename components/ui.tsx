import type { ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] whitespace-nowrap rounded-full transition-[background-color,border-color,color,opacity] duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-[#0A0A0A] hover:bg-[var(--accent-hover)]',
  accent: 'bg-[var(--signal)] text-[#0A0A0A] hover:bg-[var(--signal-hover)]',
  secondary:
    'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[#1B1B1B]',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]',
  danger: 'border border-[var(--border-subtle)] text-[var(--danger)] hover:border-[var(--danger)] hover:bg-[var(--danger-soft)]',
};

const SIZES: Record<Size, string> = {
  lg: 'h-12 px-6 text-[15px]',
  md: 'h-10 px-5 text-[14px]',
  sm: 'h-8 px-3.5 text-[13px]',
};

/** Class string for any clickable element, so Link, a, and button all match. */
export function btn(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}

/** Raised surface used for every panel in the app. */
export const card = 'rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)]';

/** Form controls. */
export const inputClass =
  'w-full h-10 px-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] transition-colors hover:border-[var(--border-subtle)] focus:border-[var(--signal-line)] focus:outline-none focus:ring-4 focus:ring-[var(--signal-soft)]';
export const textareaClass =
  'w-full px-3.5 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-card)] text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-dimmer)] transition-colors hover:border-[var(--border-subtle)] focus:border-[var(--signal-line)] focus:outline-none focus:ring-4 focus:ring-[var(--signal-soft)]';
export const fieldLabel = 'block text-[13px] text-[var(--text-muted)] mb-1.5';

export type Tone = 'neutral' | 'signal' | 'positive' | 'warning' | 'info' | 'muted';

const TONES: Record<Tone, string> = {
  neutral: 'bg-[var(--accent-soft)] text-[var(--text-secondary)] [--dot:var(--text-muted)]',
  muted: 'bg-transparent border border-[var(--border-card)] text-[var(--text-muted)] [--dot:var(--text-dimmer)]',
  signal: 'bg-[var(--signal-soft)] text-[var(--signal)] [--dot:var(--signal)]',
  positive: 'bg-[var(--positive-soft)] text-[var(--positive)] [--dot:var(--positive)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)] [--dot:var(--warning)]',
  info: 'bg-[var(--info-soft)] text-[var(--info)] [--dot:var(--info)]',
};

/** Status pill: a dot plus a word, so state reads in colour and in text. */
export function StatusPill({
  tone = 'neutral',
  children,
  dot = true,
  pulse = false,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-medium whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {dot && (
        <span className="relative flex w-1.5 h-1.5">
          {pulse && (
            <span className="absolute inset-0 rounded-full bg-[var(--dot)] opacity-60 animate-ping motion-reduce:hidden" />
          )}
          <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--dot)]" />
        </span>
      )}
      {children}
    </span>
  );
}

/** Small neutral tag for genres, moods, and kinds. */
export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border border-[var(--border-card)] text-[12px] text-[var(--text-muted)] whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/** Content area for signed-in app pages (inside the sidebar shell). */
export function AppPage({ children, width = 'wide' }: { children: ReactNode; width?: 'wide' | 'narrow' | 'full' }) {
  const max = width === 'narrow' ? 'max-w-[760px]' : width === 'full' ? 'max-w-none' : 'max-w-[1180px]';
  return <div className={`${max} mx-auto w-full px-5 md:px-10 pt-8 md:pt-12 pb-28`}>{children}</div>;
}

export function AppHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] text-[var(--text-muted)] mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.03em] leading-[1.1] text-balance">{title}</h1>
        {description && (
          <p className="mt-2.5 text-[15px] text-[var(--text-muted)] leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </header>
  );
}

/** Marketing-page wrapper (home, FAQ). */
export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="flex-1 min-w-0 pt-14 md:pt-20 pb-24">
      <div className={`${narrow ? 'max-w-3xl' : 'max-w-[1440px]'} mx-auto px-5 md:px-[60px]`}>{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div className="max-w-3xl">
        <h1 className="display-title text-balance">{title}</h1>
        {description && (
          <p className="mt-4 text-base text-[var(--text-tertiary)] leading-relaxed max-w-xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  count,
  description,
  actions,
  id,
}: {
  title: string;
  count?: number;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="flex items-end justify-between gap-4 mb-4 scroll-mt-24">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em] flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-[var(--accent-soft)] text-[12px] font-medium text-[var(--text-muted)] tabular-nums">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-1 text-[14px] text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-14 md:py-20 text-center">
      {icon && (
        <div className="mx-auto mb-5 w-11 h-11 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold tracking-[-0.015em]">{title}</p>
      {body && <p className="mt-2 text-[14px] text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
