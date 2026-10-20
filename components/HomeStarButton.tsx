'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setHomeFeatured } from '@/app/briefs/actions';
import { btn } from '@/components/ui';

export default function HomeStarButton({
  briefId,
  featured,
  variant = 'icon',
}: {
  briefId: string;
  featured: boolean;
  variant?: 'icon' | 'menu';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = await setHomeFeatured(briefId, !featured);
      if (result.error) window.alert(result.error);
      else router.refresh();
    });
  }

  const label = featured ? 'On the homepage. Click to remove.' : 'Feature on the homepage';

  if (variant === 'menu') {
    return (
      <button type="button" onClick={toggle} disabled={pending} className={btn('secondary', 'sm')}>
        {pending ? 'Saving…' : featured ? '★ On homepage' : '☆ Feature on homepage'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={label}
      aria-label={label}
      aria-pressed={featured}
      className={`w-8 h-8 flex items-center justify-center rounded-[2px] border backdrop-blur-sm transition-colors disabled:opacity-50 ${
        featured
          ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-base)]'
          : 'bg-[var(--bg-base)]/70 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]'
      }`}
    >
      {featured ? '★' : '☆'}
    </button>
  );
}
