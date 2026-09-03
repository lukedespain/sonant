'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotificationBell({ profileHref }: { profileHref: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && typeof json?.unread === 'number') setUnread(json.unread);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href={`${profileHref}#alerts`}
      aria-label={unread > 0 ? `${unread} unread alerts` : 'Alerts'}
      className="relative h-10 w-10 flex items-center justify-center border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
      style={{ borderRadius: '2px' }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.75a3.5 3.5 0 00-3.5 3.5v2.1L3.2 9.6A.6.6 0 003.7 10.5h8.6a.6.6 0 00.5-.9L11.5 7.35V5.25A3.5 3.5 0 008 1.75z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.4 12.2a1.6 1.6 0 003.2 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-[#E85D2F] text-[var(--bg-base)] text-[9px] leading-none"
          style={{ borderRadius: '2px', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
