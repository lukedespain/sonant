'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

type NavProps = {
  user: User | null
  accountType: 'composer' | 'business' | null
  submissionCredits?: number
  sessionCredits?: number
}

const LINKS = [
  { href: '/generator', label: 'Generator', note: 'Write to a brief' },
  { href: '/browse', label: 'Briefs', note: 'Catalog and practice' },
  { href: '/catalog', label: 'Catalog', note: 'Music we pitch' },
  { href: '/feedback', label: 'Feedback', note: '45-minute sessions' },
] as const;

export default function Nav({ user, accountType, submissionCredits = 0 }: NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

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
  const showDashboard = !!user && !isAuthPage
  const showComposerActions = !!user && accountType === 'composer' && !isAuthPage

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

  async function buySubmissionCredit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'submission' }),
    })
    setCheckoutLoading(false)
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
            {showDashboard && (
              <Link
                href="/account"
                onClick={closeMenu}
                className="h-10 px-4 flex items-center border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Dashboard
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
              <div
                className="text-[9px] tracking-[0.35em] uppercase text-[var(--text-dimmer)] mb-6 leading-none"
                style={mono}
              >
                Menu
              </div>

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

            <div className="px-8 md:px-10 py-8 border-t border-[var(--border-base)] flex flex-col gap-3">
              {showComposerActions ? (
                <>
                  <div
                    className="flex items-stretch border border-[var(--border-subtle)]"
                    style={{ borderRadius: '2px' }}
                  >
                    <div
                      className="flex-1 px-4 py-3.5 text-[10px] tracking-[0.18em] uppercase text-[var(--text-secondary)]"
                      style={mono}
                    >
                      Submission Credits: {submissionCredits}
                    </div>
                    <button
                      type="button"
                      onClick={buySubmissionCredit}
                      disabled={checkoutLoading}
                      className="px-4 border-l border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[#E85D2F] hover:border-[#E85D2F] transition-colors disabled:opacity-40"
                      style={{ ...mono, fontSize: '16px', lineHeight: 1 }}
                      aria-label="Buy more submission credits"
                      title="Buy more"
                    >
                      {checkoutLoading ? '…' : '+'}
                    </button>
                  </div>
                  <Link
                    href="/feedback"
                    onClick={closeMenu}
                    className="block w-full px-4 py-3.5 text-center text-[10px] tracking-[0.18em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors"
                    style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
                  >
                    Schedule a 1:1 Session
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]" style={mono}>
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  {user ? null : (
                    <div className="flex items-center gap-6">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        style={mono}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={closeMenu}
                        className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] hover:opacity-70 transition-opacity"
                        style={mono}
                      >
                        Create Account →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
