'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'
import { signOut } from '@/app/auth/actions'

type NavProps = {
  user: User | null
  accountType: 'composer' | 'business' | null
  displayName?: string
  avatarUrl?: string | null
  acceptedCount?: number
  submissionCredits?: number
  sessionCredits?: number
}

const LINKS = [
  { href: '/generator', label: 'Generator', note: 'Create a brief' },
  { href: '/browse', label: 'Briefs', note: 'Compose to spec' },
  { href: '/submissions', label: 'Submissions', note: 'Submit to catalog' },
  { href: '/sessions', label: 'Sessions', note: '1:1 music feedback' },
] as const;

const AVATAR_COLORS = [
  '#E85D2F', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009473', '#DD4132', '#45B5AA',
];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function VerifiedCheck() {
  return (
    <span
      className="absolute -right-0.5 -bottom-0.5 w-4 h-4 flex items-center justify-center bg-[#E85D2F] text-[var(--bg-base)]"
      style={{ borderRadius: '999px' }}
      aria-hidden="true"
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path d="M1.5 4.6l2 2 4-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function Nav({
  user,
  displayName = '',
  avatarUrl = null,
  acceptedCount = 0,
  submissionCredits = 0,
  sessionCredits = 0,
}: NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<'submission' | 'session' | null>(null)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname?.startsWith('/auth')

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : href === '/browse'
      ? pathname === '/browse' || pathname?.startsWith('/browse/')
      : pathname === href || pathname?.startsWith(href + '/')

  const closeMenu = () => setMenuOpen(false)
  const loggedIn = !!user && !isAuthPage
  const name = displayName || 'Composer'
  const verified = acceptedCount >= 3
  const placed = Math.min(acceptedCount, 3)
  const profileHref = user ? `/profile/${user.id}` : '/login?redirect=/profile'

  const mono = { fontFamily: "'JetBrains Mono', monospace" }
  const serif = { fontFamily: "'Fraunces', serif" }

  useEffect(() => {
    closeMenu()
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  async function startCheckout(type: 'submission' | 'session') {
    setCheckoutLoading(type)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    setCheckoutLoading(null)
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{
                background: '#E85D2F',
                color: 'var(--bg-base)',
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
                borderRadius: '2px',
              }}
            >
              ◆
            </div>
            <span
              className="text-base tracking-tight"
              style={{ ...serif, fontWeight: 500 }}
            >
              Sonant<span className="text-[#E85D2F]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {!isAuthPage && !loggedIn && (
              <Link
                href="/login"
                onClick={closeMenu}
                className="h-10 px-4 flex items-center border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Sign In
              </Link>
            )}

            {!isAuthPage && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center w-10 h-10 border border-[var(--border-subtle)] hover:border-[var(--text-dim)] transition-colors"
                style={{ borderRadius: '2px' }}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                    <path d="M0 1H16M0 5.5H16M0 10H16" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {!isAuthPage && menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--bg-base)]/70 backdrop-blur-sm"
            onClick={closeMenu}
          />

          <div className="fixed top-[73px] right-0 bottom-0 z-40 w-full max-w-md border-l border-[var(--border-base)] bg-[var(--bg-base)] flex flex-col">
            <div className="px-8 md:px-10 pt-8 flex-1 overflow-y-auto">
              {loggedIn && user ? (
                <Link
                  href={profileHref}
                  onClick={closeMenu}
                  className="flex items-start gap-4 mb-8 group"
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white text-sm"
                      style={{
                        background: avatarUrl ? undefined : avatarColor(user.id),
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        : getInitials(name)}
                    </div>
                    {verified && <VerifiedCheck />}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div
                      className="text-xl tracking-tight text-[var(--text-primary)] group-hover:text-[#E85D2F] transition-colors truncate"
                      style={{ ...serif, fontWeight: 300 }}
                    >
                      {name}
                    </div>
                    {verified ? (
                      <div
                        className="mt-1 text-[9px] tracking-[0.2em] uppercase text-[#E85D2F]"
                        style={mono}
                      >
                        Sonant Composer
                      </div>
                    ) : (
                      <>
                        <div
                          className="mt-1 text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]"
                          style={mono}
                          title="Three catalog placements to verify"
                        >
                          {placed} / 3 catalog placements
                        </div>
                        <div className="mt-2 h-[2px] w-full bg-[var(--border-base)] overflow-hidden" style={{ borderRadius: '2px' }}>
                          <div
                            className="h-full bg-[#E85D2F]"
                            style={{ width: `${(placed / 3) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              ) : (
                <div
                  className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-6 leading-none"
                  style={mono}
                >
                  Menu
                </div>
              )}

              <nav className="flex flex-col">
                {LINKS.map(({ href, label, note }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeMenu}
                      className="group py-5 border-b border-[var(--border-base)] flex items-baseline justify-between gap-4"
                    >
                      <span
                        className={`text-2xl tracking-tight transition-colors ${
                          active
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                        }`}
                        style={{ ...serif, fontWeight: 300 }}
                      >
                        {label}
                        {active && (
                          <span className="ml-2 text-[#E85D2F] text-sm">◆</span>
                        )}
                      </span>
                      <span
                        className="text-[10px] tracking-[0.12em] uppercase text-[var(--text-dimmer)] hidden sm:block"
                        style={mono}
                      >
                        {note}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="px-8 md:px-10 py-8 border-t border-[var(--border-base)] flex flex-col gap-5">
              {loggedIn && (
                <div className="flex flex-col gap-4 pb-5 border-b border-[var(--border-base)]">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-1" style={mono}>
                        Submission credits
                      </div>
                      <div className="text-2xl text-[var(--text-primary)] leading-none" style={{ ...serif, fontWeight: 300 }}>
                        {submissionCredits}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCheckout('submission')}
                      disabled={checkoutLoading === 'submission'}
                      className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40 mb-0.5"
                      style={mono}
                    >
                      {checkoutLoading === 'submission' ? '…' : '+ Add'}
                    </button>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--text-dimmer)] mb-1" style={mono}>
                        Session credits
                      </div>
                      <div className="text-2xl text-[var(--text-primary)] leading-none" style={{ ...serif, fontWeight: 300 }}>
                        {sessionCredits}
                      </div>
                    </div>
                    {sessionCredits > 0 ? (
                      <Link
                        href="/sessions"
                        onClick={closeMenu}
                        className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 mb-0.5"
                        style={mono}
                      >
                        Book
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCheckout('session')}
                        disabled={checkoutLoading === 'session'}
                        className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70 disabled:opacity-40 mb-0.5"
                        style={mono}
                      >
                        {checkoutLoading === 'session' ? '…' : 'Buy'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <ThemeToggle label="Change Theme" />
                {loggedIn ? (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex items-center gap-3 text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      style={mono}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M7 8h7m0 0l-2.5-2.5M14 8l-2.5 2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity"
                    style={mono}
                  >
                    Create Account →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
