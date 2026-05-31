'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type NavProps = {
  user: User | null
}

export default function Nav({ user }: NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname?.startsWith('/auth')

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="border-b border-[#1F1D1A]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
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

        {/* Desktop center links */}
        {!isAuthPage && (
          <div
            className="hidden md:flex items-center gap-8 text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Link
              href="/submissions"
              className={`cursor-pointer transition-colors ${
                isActive('/submissions') ? 'text-[#F5F1E8]' : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Submissions
            </Link>
            <Link
              href="/reviews"
              className={`cursor-pointer transition-colors ${
                isActive('/reviews') ? 'text-[#F5F1E8]' : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Live Reviews
            </Link>
            <Link
              href="/catalog"
              className={`cursor-pointer transition-colors ${
                isActive('/catalog') ? 'text-[#F5F1E8]' : 'text-[#8A8680] hover:text-[#F5F1E8]'
              }`}
            >
              Catalog
            </Link>
          </div>
        )}

        {/* Desktop right buttons */}
        {!isAuthPage && (
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/browse"
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-2 border transition-colors ${
                    isActive('/browse')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] hover:border-[#E85D2F] hover:text-[#E85D2F]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Browse Briefs
                </Link>
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

        {/* Mobile hamburger */}
        {!isAuthPage && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-8 h-8"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3L15 15M15 3L3 15" stroke="#F5F1E8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <path d="M0 1H20M0 7H20M0 13H20" stroke="#F5F1E8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Mobile menu panel */}
      {!isAuthPage && menuOpen && (
        <div className="md:hidden border-t border-[#1F1D1A] px-6 pb-6 flex flex-col">
          {/* Nav links */}
          <Link
            href="/submissions"
            onClick={closeMenu}
            className={`py-4 text-sm border-b border-[#1F1D1A] transition-colors ${
              isActive('/submissions') ? 'text-[#F5F1E8]' : 'text-[#8A8680]'
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Submissions
          </Link>
          <Link
            href="/reviews"
            onClick={closeMenu}
            className={`py-4 text-sm border-b border-[#1F1D1A] transition-colors ${
              isActive('/reviews') ? 'text-[#F5F1E8]' : 'text-[#8A8680]'
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Live Reviews
          </Link>
          <Link
            href="/catalog"
            onClick={closeMenu}
            className={`py-4 text-sm border-b border-[#1F1D1A] transition-colors ${
              isActive('/catalog') ? 'text-[#F5F1E8]' : 'text-[#8A8680]'
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Catalog
          </Link>

          {/* User buttons */}
          <div className="flex flex-col gap-3 pt-5">
            {user ? (
              <>
                <Link
                  href="/browse"
                  onClick={closeMenu}
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-3 border text-center transition-colors ${
                    isActive('/browse')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] text-[#8A8680]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Browse Briefs
                </Link>
                <Link
                  href="/library"
                  onClick={closeMenu}
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-3 border text-center transition-colors ${
                    isActive('/library')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] text-[#8A8680]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  My Library
                </Link>
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className={`text-xs tracking-[0.2em] uppercase px-4 py-3 border text-center transition-colors ${
                    isActive('/account')
                      ? 'border-[#E85D2F] text-[#E85D2F]'
                      : 'border-[#3A3835] text-[#8A8680]'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  Account
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="text-xs tracking-[0.2em] uppercase px-4 py-3 border border-[#3A3835] text-[#8A8680] text-center transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
