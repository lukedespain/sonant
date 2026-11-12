import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium tracking-[-0.005em] whitespace-nowrap rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent-hover)] font-medium',
  secondary:
    'border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)]',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
};

const SIZES: Record<Variant, Record<Size, string>> = {
  primary: { md: 'h-11 px-6 text-[15px]', sm: 'h-9 px-4 text-sm' },
  secondary: { md: 'h-11 px-6 text-[15px]', sm: 'h-9 px-4 text-sm' },
  ghost: { md: 'h-11 text-[15px]', sm: 'h-9 text-sm' },
};

/** Class string for any clickable element, so Link, a, and button all match. */
export function btn(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[variant][size]} ${extra}`.trim();
}

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
        <h1 className="display-title text-balance">
          {title}
        </h1>
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
  actions,
  id,
}: {
  title: string;
  count?: number;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="flex items-baseline justify-between gap-4 mb-6 scroll-mt-24">
      <h2 className="text-2xl md:text-[1.75rem] font-medium tracking-[-0.02em]">
        {title}
        {count !== undefined && (
          <span className="ml-3 text-base text-[var(--text-dimmer)] tabular-nums">{count}</span>
        )}
      </h2>
      {actions && <div className="flex items-center gap-4 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-[var(--border-card)] rounded-[2px] px-6 py-12 md:py-16 text-center">
      <p className="text-xl md:text-2xl font-medium tracking-[-0.02em]">{title}</p>
      {body && <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
