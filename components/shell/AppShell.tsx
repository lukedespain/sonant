'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { setSiteView } from '@/app/auth/view-actions';
import { signOut } from '@/app/auth/actions';
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark';
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners';
import { btn } from '@/components/ui';
import {
  IconArrowUpRight,
  IconBriefs,
  IconClose,
  IconEye,
  IconFolder,
  IconInbox,
  IconMenu,
  IconPen,
  IconPlus,
  IconSignOut,
  IconStar,
  IconUser,
  IconWaveform,
} from './icons';

export type ShellData = {
  signedIn: boolean;
  /** Admin UI is showing (a real admin who has not switched to the composer view). */
  isAdmin: boolean;
  /** A real admin, who can switch between the admin and composer views. */
  canSwitchView: boolean;
  name: string;
  email: string;
  offersWaiting: number;
  reviewQueue: number;
  /** Unread project messages for this person (composer side or admin side). */
  projectUnread: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  badge?: number;
  /** Ties the item to a "How it works" step on the homepage. */
  flow?: string;
  match: (path: string, tab: string | null) => boolean;
};


// Ordered the way a composer moves: write to a brief, follow the submission,
// get invited to projects. Profile is set once, so it sits last.
function composerItems(data: ShellData): NavItem[] {
  return [
    {
      href: '/briefs',
      label: 'Briefs',
      icon: IconBriefs,
      flow: 'briefs',
      match: (p) => p === '/briefs' || p.startsWith('/briefs/'),
    },
    {
      href: '/dashboard',
      label: 'Submissions',
      icon: IconWaveform,
      badge: data.offersWaiting,
      flow: 'submissions',
      match: (p, tab) => p === '/dashboard' && tab !== 'profile' && tab !== 'info' && tab !== 'settings',
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: IconFolder,
      badge: data.projectUnread,
      flow: 'projects',
      match: (p) => p === '/projects' || p.startsWith('/projects/'),
    },
    {
      href: '/dashboard?tab=profile',
      label: 'Profile',
      icon: IconUser,
      flow: 'profile',
      match: (p, tab) => p === '/dashboard' && (tab === 'profile' || tab === 'info' || tab === 'settings'),
    },
  ];
}

function adminItems(data: ShellData): NavItem[] {
  const tabIs = (id: string) => (p: string, tab: string | null) => p === '/admin' && tab === id;
  return [
    { href: '/admin?tab=briefs', label: 'Create brief', icon: IconPen, match: tabIs('briefs') },
    { href: '/admin?tab=projects', label: 'Add project', icon: IconPlus, match: tabIs('projects') },
    {
      href: '/admin',
      label: 'Review queue',
      icon: IconInbox,
      badge: data.reviewQueue,
      match: (p, tab) => p === '/admin' && !tab,
    },
    { href: '/admin?tab=roster', label: 'Composer roster', icon: IconStar, match: tabIs('roster') },
  ];
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname() ?? '';
  const tab = useSearchParams().get('tab');
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.match(pathname, tab);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              data-flow-target={item.flow}
              className={`flow-ring group flex items-center gap-3 h-9 px-3 rounded-xl text-[14px] transition-colors ${
                active
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-card)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]'
              }`}
            >
              <span className={active ? 'text-[var(--signal)]' : 'text-[var(--text-dim)] group-hover:text-[var(--text-secondary)]'}>
                <Icon size={16} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {!!item.badge && item.badge > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--signal)] text-[#0A0A0A] text-[11px] font-semibold flex items-center justify-center tabular-nums">
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'TC';
}

function ViewSwitch({ asComposer, compact = false }: { asComposer: boolean; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const label = asComposer ? 'Switch to admin view' : 'View as a composer';
  function toggle() {
    start(async () => {
      await setSiteView(asComposer ? 'admin' : 'composer');
      router.refresh();
    });
  }
  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        title={label}
        aria-label={label}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
          asComposer
            ? 'bg-[var(--signal-soft)] text-[var(--signal)]'
            : 'text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]'
        }`}
      >
        <IconEye size={15} />
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} disabled={pending} className={btn('secondary', 'sm', 'shrink-0')}>
      {pending ? 'Switching…' : 'Back to admin'}
    </button>
  );
}

/** The logo is the Home item: it lights up on the portal homepage. */
function HomeLink({ onNavigate }: { onNavigate?: () => void }) {
  const active = usePathname() === '/';
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
        active ? 'bg-[var(--bg-elevated)] shadow-[inset_0_0_0_1px_var(--border-card)]' : 'hover:bg-[var(--accent-soft)]'
      }`}
    >
      <ThoughtCollectiveMark size={22} />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold tracking-[-0.02em] leading-tight">Thought Collective</span>
        <span className={`block text-[12px] leading-tight ${active ? 'text-[var(--signal)]' : 'text-[var(--text-dim)]'}`}>Composer portal</span>
      </span>
    </Link>
  );
}

function SidebarContent({ data, onNavigate }: { data: ShellData; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-4 pb-6">
        <HomeLink onNavigate={onNavigate} />
      </div>

      <nav className="flex-1 overflow-y-auto app-scroll px-3 flex flex-col gap-7" aria-label="Main">
        <Suspense fallback={null}>
          <NavLinks items={composerItems(data)} onNavigate={onNavigate} />
          {data.isAdmin && (
            <div>
              <p className="px-3 mb-2 text-[12px] text-[var(--text-dimmer)]">Admin</p>
              <NavLinks items={adminItems(data)} onNavigate={onNavigate} />
            </div>
          )}
        </Suspense>
      </nav>

      <div className="px-3 pb-4 pt-4 flex flex-col gap-3">
        {data.signedIn ? (
          <>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <span className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)] shrink-0">
                {initials(data.name, data.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate">{data.name || 'Composer'}</p>
                <p className="text-[12px] text-[var(--text-dim)] truncate">{data.email}</p>
              </div>
              {data.canSwitchView && <ViewSwitch asComposer={!data.isAdmin} compact />}
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign out"
                  aria-label="Sign out"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <IconSignOut size={15} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
            <p className="text-[14px] font-medium tracking-[-0.01em]">Write for Thought Collective</p>
            <p className="mt-1 text-[12px] text-[var(--text-dim)] leading-snug">Free to join. Write to our briefs and get your music into our catalogue.</p>
            <div className="mt-3.5 flex flex-col gap-2">
              <Link href="/signup" onClick={onNavigate} className={btn('primary', 'sm', 'w-full')}>
                Create an account
              </Link>
              <Link href="/login" prefetch={false} onClick={onNavigate} className={btn('ghost', 'sm', 'w-full')}>
                Sign in
              </Link>
            </div>
          </div>
        )}
        <div className="px-2 flex items-center gap-4 text-[12px] text-[var(--text-dimmer)]">
          <Link href="/#faq" onClick={onNavigate} className="hover:text-[var(--text-secondary)] transition-colors">
            FAQ
          </Link>
          <a href={THOUGHT_COLLECTIVE_SITE} className="inline-flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors">
            Main site <IconArrowUpRight size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ data, children }: { data: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath !== null && drawerPath === pathname;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerPath(null);
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="flex-1 flex min-h-screen">
      <aside className="no-print hidden lg:block fixed inset-y-0 left-0 z-30 w-[248px] border-r border-[var(--border-base)] bg-[var(--bg-sidebar)]">
        <SidebarContent data={data} />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col lg:pl-[248px] print:pl-0">
        <header className="no-print lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b border-[var(--border-base)] bg-[var(--bg-base)]/85 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2.5">
            <ThoughtCollectiveMark size={20} />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Thought Collective</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerPath(pathname)}
            aria-label="Open menu"
            className="relative w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
          >
            <IconMenu size={18} />
            {(data.offersWaiting > 0 || data.projectUnread > 0 || (data.isAdmin && data.reviewQueue > 0)) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--signal)]" />
            )}
          </button>
        </header>

        {data.canSwitchView && !data.isAdmin && (
          <div className="no-print sticky top-14 lg:top-0 z-30 flex items-center justify-between gap-3 px-5 md:px-10 py-2.5 bg-[var(--signal-soft)] border-b border-[var(--signal-line)] backdrop-blur-md">
            <p className="text-[13px] text-[var(--signal)] flex items-center gap-2">
              <IconEye size={14} /> You are seeing the site as a composer. Admin tools are hidden.
            </p>
            <ViewSwitch asComposer />
          </div>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerPath(null)}
            className="absolute inset-0 bg-black/70 animate-fade"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] bg-[var(--bg-sidebar)] border-r border-[var(--border-card)] animate-drawer">
            <button
              type="button"
              onClick={() => setDrawerPath(null)}
              aria-label="Close menu"
              className="absolute top-5 right-3 w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"
            >
              <IconClose size={16} />
            </button>
            <SidebarContent data={data} onNavigate={() => setDrawerPath(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
