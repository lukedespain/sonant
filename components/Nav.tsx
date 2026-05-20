'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type NavProps = {
  user: User | null
}

export default function Nav({ user }: NavProps) {
  const pathname = usePathname()
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname?.startsWith('/auth')

  // A route is active if the pathname matches it or sits beneath it
  // (e.g. /library/abc123 should still mark the Library box active).
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav className="border-b border-[#1F1D1A]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              background: '#E85D2F',
              color: '#0A0908',
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              borderRadius: '2px',
            }}
          >
            ◆
          </div>
          <span
            className="text-base tracking-tight"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Sonant<span className="text-[#E85D2F]">.</span>
          </span>
        </Link>

        {!isAuthPage && (
          <div
            className="hidden md:flex items-center gap-8 text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Link
              href="/submissions"
              className={`cursor-pointer transition-colors ${
                isActive('/submissions')
                  ? 'text-[#F5F1E8]'
                  : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Submissions
            </Link>
            <Link
              href="/reviews"
              className={`cursor-pointer transition-colors ${
                isActive('/reviews')
                  ? 'text-[#F5F1E8]'
                  : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Reviews
            </Link>
            <Link
              href="/catalog"
              className={`cursor-pointer transition-colors ${
                isActive('/catalog')
                  ? 'text-[#F5F1E8]'
                  : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Catalog
            </Link>
          </div>
        )}

        {!isAuthPage && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/library"
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                    isActive('/library')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  My Library
                </Link>
                <Link
                  href="/account"
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                    isActive('/account')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Account
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}