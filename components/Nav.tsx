'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'

type NavProps = {
  user: User | null
  isSiteAdmin?: boolean
}

const LINKS = [
  { href: '/generator', label: 'Generator' },
  { href: '/browse', label: 'Library' },
  { href: '/submissions', label: 'Catalog' },
] as const

export default function Nav({
  user,
  isSiteAdmin = false,
}: NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname?.startsWith('/auth')

  const isActive = (href: string) =>
    href === '/browse'
      ? pathname === '/browse' || pathname?.startsWith('/browse/')
      : pathname === href || pathname?.startsWith(href + '/')

  const loggedIn = !!user && !isAuthPage
  const showPages = !isAuthPage

  const mono = { fontFamily: "'JetBrains Mono', monospace" }
  const serif = { fontFamily: "'Fraunces', serif" }

  const closeMenu = () => setMenuOpen(false)

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

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--border-base)] bg-[var(--bg-base)] overflow-x-clip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr]">

          <Link href="/" className="flex items-center gap-3 justify-self-start min-w-0" onClick={closeMenu}>
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
              className="text-base tracking-tight hidden sm:inline"
              style={{ ...serif, fontWeight: 500 }}
            >
              Sonant<span className="text-[#E85D2F]">.</span>
            </span>
          </Link>

          {showPages ? (
            <div className="hidden md:flex items-center justify-center gap-8">
              {LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`text-[10px] tracking-[0.2em] uppercase transition-colors whitespace-nowrap ${
                      active
                        ? 'text-[#E85D2F]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    style={mono}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          <div className="hidden md:flex items-center gap-2.5 justify-self-end">
            {!isAuthPage && !loggedIn && (
              <Link
                href="/login"
                className="h-10 px-4 flex items-center border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ ...mono, borderRadius: '2px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Sign In
              </Link>
            )}

            {loggedIn && user && isSiteAdmin && (
              <Link
                href="/admin"
                className={`h-10 px-4 flex items-center border transition-colors ${
                  pathname?.startsWith('/admin')
                    ? 'border-[#E85D2F] text-[#E85D2F]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                }`}
                style={{ ...mono, borderRadius: '2px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Dashboard
              </Link>
            )}

            {loggedIn && user && (
              <Link
                href={`/profile/${user.id}`}
                className={`h-10 px-4 flex items-center border transition-colors ${
                  pathname?.startsWith('/profile')
                    ? 'border-[#E85D2F] text-[#E85D2F]'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                }`}
                style={{ ...mono, borderRadius: '2px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Profile
              </Link>
            )}
          </div>

          {!isAuthPage && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-10 h-10 border border-[var(--border-subtle)] hover:border-[var(--text-dim)] transition-colors shrink-0"
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
      </nav>

      {!isAuthPage && menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 z-40 bg-[var(--bg-base)] flex flex-col overflow-y-auto">
          <div className="px-6 pt-4 flex-1">
            <nav className="flex flex-col">
              {LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="py-5 border-b border-[var(--border-base)]"
                  >
                    <span
                      className={`text-2xl tracking-tight ${
                        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                      }`}
                      style={{ ...serif, fontWeight: 300 }}
                    >
                      {label}
                      {active && <span className="ml-2 text-[#E85D2F] text-sm">◆</span>}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="px-6 py-8 border-t border-[var(--border-base)] flex flex-col gap-5">
            {loggedIn && user && (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  onClick={closeMenu}
                  className={`text-[10px] tracking-[0.2em] uppercase ${
                    pathname?.startsWith('/profile') ? 'text-[#E85D2F]' : 'text-[var(--text-secondary)]'
                  }`}
                  style={mono}
                >
                  Profile
                </Link>
                {isSiteAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className={`text-[10px] tracking-[0.2em] uppercase ${
                      pathname?.startsWith('/admin') ? 'text-[#E85D2F]' : 'text-[var(--text-secondary)]'
                    }`}
                    style={mono}
                  >
                    Dashboard
                  </Link>
                )}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]"
                    style={mono}
                  >
                    Sign Out
                  </button>
                </form>
              </>
            )}

            {!loggedIn && (
              <Link
                href="/login"
                onClick={closeMenu}
                className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F]"
                style={mono}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
