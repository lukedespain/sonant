'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import ThoughtCollectiveMark from '@/components/ThoughtCollectiveMark'
import { THOUGHT_COLLECTIVE_SITE } from '@/lib/partners'

type NavProps = {
  user: User | null
  isSiteAdmin?: boolean
}

const CONTACT_EMAIL = 'hello@thoughtcollective.com'

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0" onClick={onClick}>
      <ThoughtCollectiveMark size={26} />
      <span className="text-[17px] md:text-[19px] tracking-[-0.02em] font-medium">Thought Collective</span>
    </Link>
  )
}

/** The "+ Menu" / "— Close" toggle from wearethoughtcollective.com. */
function MenuToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="flex items-center gap-3 h-10 px-1 text-[17px] tracking-[-0.01em] text-[var(--text-primary)] hover:opacity-70 transition-opacity"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M0 9H18" stroke="currentColor" strokeWidth="1.25" />
        {!open && <path d="M9 0V18" stroke="currentColor" strokeWidth="1.25" />}
      </svg>
      {open ? 'Close' : 'Menu'}
    </button>
  )
}

export default function Nav({ user, isSiteAdmin = false }: NavProps) {
  const pathname = usePathname()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath !== null && menuPath === pathname
  const closeMenu = () => setMenuPath(null)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname?.startsWith('/auth')
  const loggedIn = !!user && !isAuthPage

  const links = [
    { href: '/', label: 'Home' },
    { href: '/briefs', label: 'Briefs' },
    ...(loggedIn ? [{ href: '/dashboard', label: 'Dashboard' }] : [{ href: '/login', label: 'Sign in' }]),
    ...(isSiteAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    { href: '/faq', label: 'FAQ' },
  ]
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(href + '/')

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPath(null)
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <nav className="no-print sticky top-0 z-50 bg-[var(--bg-base)]/85 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] h-20 md:h-24 flex items-center justify-between gap-6">
          <Wordmark onClick={closeMenu} />
          {!isAuthPage && (
            <div className="flex items-center gap-6">
              {!loggedIn && (
                <Link
                  href="/login"
                  prefetch={false}
                  className="hidden sm:block text-[17px] tracking-[-0.01em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Sign in
                </Link>
              )}
              <MenuToggle open={menuOpen} onClick={() => setMenuPath(menuOpen ? null : pathname)} />
            </div>
          )}
        </div>
      </nav>

      {!isAuthPage && menuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--bg-base)] overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] pt-28 md:pt-40 pb-16 grid md:grid-cols-2 gap-16 min-h-full">
            <div className="hidden md:block" aria-hidden="true" />
            <div className="flex flex-col justify-between gap-16">
              <ul className="flex flex-col gap-1 md:gap-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMenu}
                      prefetch={href === '/login' ? false : undefined}
                      aria-current={isActive(href) ? 'page' : undefined}
                      className={`block text-[3.25rem] md:text-[6rem] leading-[1.02] font-medium tracking-[-0.045em] transition-colors ${
                        isActive(href) ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] hover:text-[var(--text-muted)]'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-8 text-[17px] tracking-[-0.01em]">
                <div>
                  <p className="text-[var(--text-muted)] mb-2">Email</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:opacity-70">{CONTACT_EMAIL}</a>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-2">Thought Collective</p>
                  <a href={THOUGHT_COLLECTIVE_SITE} className="hover:opacity-70">Main site ↗</a>
                  {loggedIn && (
                    <form action={signOut} className="mt-1">
                      <button type="submit" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        Sign out
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
