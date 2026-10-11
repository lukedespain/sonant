'use client'

import Link, { useLinkStatus } from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import ThemeToggle from '@/components/ThemeToggle'
import { btn } from '@/components/ui'

function SignInLabel() {
  const { pending } = useLinkStatus()
  return pending ? (
    <><span className="animate-pulse">◆</span>Signing in</>
  ) : <>Sign in</>
}

type NavProps = {
  user: User | null
  isSiteAdmin?: boolean
}

const LINKS = [
  { href: '/generator', label: 'Generator' },
  { href: '/briefs', label: 'Briefs' },
  { href: '/catalogs', label: 'Catalogs' },
] as const

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={onClick}>
      <span
        className="w-7 h-7 flex items-center justify-center bg-[var(--accent)] text-[var(--bg-base)] font-serif font-semibold text-xs rounded-[2px]"
        aria-hidden="true"
      >
        ◆
      </span>
      <span className="font-serif text-[17px] tracking-tight font-medium">
        Sonant<span className="text-[var(--accent)]">.</span>
      </span>
    </Link>
  )
}

export default function Nav({ user, isSiteAdmin = false }: NavProps) {
  const pathname = usePathname()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath !== null && menuPath === pathname

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname?.startsWith('/auth')

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const loggedIn = !!user && !isAuthPage
  const navLinks = isSiteAdmin ? [...LINKS, { href: '/admin', label: 'Admin' }] : [...LINKS]
  const onDashboard = isActive('/dashboard')

  const closeMenu = () => setMenuPath(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPath(null)
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
      <nav className="sticky top-0 z-50 border-b border-[var(--border-base)] bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between gap-6">
          <Wordmark onClick={closeMenu} />

          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`label transition-colors ${
                      active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          )}

          {!isAuthPage && (
            <div className="flex items-center gap-1 md:gap-3">
              <ThemeToggle />
              <div className="hidden md:block">
                {loggedIn ? (
                  <Link
                    href="/dashboard"
                    className={btn('secondary', 'sm', onDashboard ? '!border-[var(--accent)] !text-[var(--accent)]' : '')}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" prefetch={false} className={btn('secondary', 'sm')}>
                    <SignInLabel />
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMenuPath(menuOpen ? null : pathname)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-[var(--text-primary)]"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                    <path d="M0 1H18M0 6H18M0 11H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </nav>

      {!isAuthPage && menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-[var(--bg-base)] flex flex-col overflow-y-auto">
          <div className="px-5 pt-2 flex-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="flex items-center justify-between py-5 border-b border-[var(--border-base)]"
                >
                  <span
                    className={`font-serif font-light text-3xl tracking-tight ${
                      active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {label}
                  </span>
                  {active && <span className="text-[var(--accent)] text-sm">◆</span>}
                </Link>
              )
            })}
          </div>

          <div className="px-5 py-8 border-t border-[var(--border-base)] flex flex-col gap-3">
            {loggedIn ? (
              <>
                <Link href="/dashboard" onClick={closeMenu} className={btn('primary', 'md', 'w-full')}>
                  Dashboard
                </Link>
                <form action={signOut}>
                  <button type="submit" className={btn('ghost', 'md', 'w-full')}>
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/signup" onClick={closeMenu} className={btn('primary', 'md', 'w-full')}>
                  Create free account
                </Link>
                <Link href="/login" prefetch={false} onClick={closeMenu} className={btn('secondary', 'md', 'w-full')}>
                  <SignInLabel />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
