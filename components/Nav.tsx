'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">

        <Link href="/" className="flex items-center gap-3 justify-self-start">
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
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {LINKS.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-colors whitespace-nowrap ${
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
          <div />
        )}

        <div className="flex items-center gap-2.5 justify-self-end">
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
      </div>
    </nav>
  )
}
