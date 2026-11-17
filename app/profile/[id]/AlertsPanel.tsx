'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AppNotification } from '@/lib/notifications';
import { SectionHeader, btn } from '@/components/ui';

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
    <div id="alerts" className="scroll-mt-24">
      <SectionHeader
        title="Updates"
        count={unread > 0 ? unread : undefined}
        actions={
          unread > 0 ? (
            <button type="button" onClick={() => mark('all')} className={btn('ghost', 'sm', 'px-3')}>
              Mark all read
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <p className="text-[14px] text-[var(--text-dim)]">Decisions and notes on your tracks show up here.</p>
      ) : (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] divide-y divide-[var(--border-base)] overflow-hidden">
          {items.slice(0, 8).map((item) => {
            const inner = (
              <span className="flex items-start gap-3">
                <span
                  className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${item.read ? 'bg-transparent' : 'bg-[var(--signal)]'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={`text-[14px] font-medium ${item.read ? 'text-[var(--text-muted)]' : ''}`}>{item.title}</span>
                    <span className="text-[12px] text-[var(--text-dimmer)] tabular-nums shrink-0">{timeAgo(item.createdAt)}</span>
                  </span>
                  <span className="block mt-0.5 text-[13px] text-[var(--text-muted)] leading-relaxed">{item.body}</span>
                </span>
              </span>
            );
            const className = 'row-hover block w-full text-left px-5 py-3.5';
            const href = item.href === '/catalog' || item.href === '/dashboard' ? '/dashboard#submissions' : item.href;
            return href ? (
              <Link
                key={item.id}
                href={href}
                onClick={(event) => {
                  if (!item.read) void mark([item.id]);
                  if (jumpOnPage(href)) event.preventDefault();
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
                className={className}
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

// Alerts usually point somewhere on the dashboard they are shown on, where a
// plain link would not move. Scroll there and flash the target instead.
function jumpOnPage(href: string): boolean {
  const [path, hash] = href.split('#');
  if (!hash || window.location.pathname !== path) return false;
  const target = document.getElementById(hash) ?? document.getElementById('submissions');
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.remove('flash-target');
  void target.offsetWidth;
  target.classList.add('flash-target');
  window.setTimeout(() => target.classList.remove('flash-target'), 2000);
  return true;
}
