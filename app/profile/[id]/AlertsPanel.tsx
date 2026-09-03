'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AppNotification } from '@/lib/notifications';

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const serif = { fontFamily: "'Fraunces', serif" } as const;

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export default function AlertsPanel({
  initialItems,
}: {
  initialItems: AppNotification[];
}) {
  const [items, setItems] = useState(initialItems);
  const unread = items.filter((item) => !item.read).length;

  async function mark(ids: string[] | 'all') {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
    });
    if (!res.ok) return;
    const json = await res.json();
    if (Array.isArray(json.notifications)) setItems(json.notifications);
  }

  return (
    <div id="alerts" className="mb-16 scroll-mt-28">
      <div className="flex items-end justify-between gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl tracking-tight" style={{ ...serif, fontWeight: 300 }}>
          Alerts<span className="italic">.</span>
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => mark('all')}
            className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F] hover:opacity-70"
            style={mono}
          >
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]" style={sans}>
          Invites, catalog decisions, and takes on your briefs will show up here.
        </p>
      ) : (
        <div className="border-t border-[var(--border-base)]">
          {items.map((item) => {
            const inner = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[#E85D2F]" style={mono}>
                    {item.title}
                  </div>
                  <div className="text-[9px] tracking-[0.15em] uppercase text-[var(--text-dimmer)]" style={mono}>
                    {timeAgo(item.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed" style={sans}>
                  {item.body}
                </p>
              </>
            );
            const className = `block py-5 border-b border-[var(--border-base)] ${item.read ? 'opacity-60' : ''}`;
            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (!item.read) void mark([item.id]);
                }}
                className={className}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.read) void mark([item.id]);
                }}
                className={`${className} w-full text-left`}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
