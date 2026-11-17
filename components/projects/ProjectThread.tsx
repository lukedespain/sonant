'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn, textareaClass } from '@/components/ui';
import type { ProjectMessage } from '@/lib/projects';

function when(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (days < 1 && d.getDate() === new Date().getDate()) return `Today ${time}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`;
}

export default function ProjectThread({
  projectId,
  composerId,
  composerName,
  viewer,
  messages: initial,
  versionNames = {},
}: {
  projectId: string;
  /** Required when an admin is writing to a composer. */
  composerId?: string;
  composerName: string;
  viewer: 'admin' | 'composer';
  messages: ProjectMessage[];
  versionNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, composerId }),
    });
    const j = (await res.json().catch(() => ({}))) as { message?: ProjectMessage; error?: string };
    setSending(false);
    if (!res.ok || !j.message) {
      setError(j.error ?? 'Could not send. Try again.');
      return;
    }
    setMessages((m) => [...m, j.message!]);
    setText('');
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
      <div className="max-h-[520px] overflow-y-auto app-scroll px-4 md:px-5 py-5 flex flex-col gap-4">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[var(--text-dim)] leading-relaxed">
            {viewer === 'composer'
              ? 'Questions about the brief, a rough idea to run past us, a heads-up on timing: write it here. Our team replies fast.'
              : `Nothing yet. Start the conversation with ${composerName}.`}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.author === viewer;
            const fromTeam = m.author === 'admin';
            return (
              <div key={m.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold ${
                    fromTeam ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {fromTeam ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/brand/thought-collective-mark.png" alt="" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    m.authorName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className={`max-w-[80%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <p className="text-[12px] text-[var(--text-dim)] mb-1" suppressHydrationWarning>
                    {fromTeam ? 'Thought Collective' : m.authorName} · {when(m.createdAt)}
                  </p>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                      mine ? 'bg-[var(--accent)] text-[#0A0A0A] rounded-tr-md' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-tl-md'
                    }`}
                  >
                    {m.submissionId && versionNames[m.submissionId] && (
                      <span className={`block text-[12px] mb-1 ${mine ? 'text-[#0A0A0A]/60' : 'text-[var(--text-dim)]'}`}>
                        On {versionNames[m.submissionId]}
                      </span>
                    )}
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-[var(--border-base)] p-3 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void send(e);
          }}
          rows={2}
          placeholder={viewer === 'admin' ? `Notes for ${composerName}…` : 'Write to the Thought Collective team…'}
          className={`${textareaClass} resize-none`}
          aria-label="Message"
        />
        <button type="submit" disabled={sending || !text.trim()} className={btn('primary', 'md', 'shrink-0')}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-[13px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
