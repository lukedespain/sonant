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

  const label = featured ? 'Featured. Click to unfeature.' : 'Make this the featured brief';

  if (variant === 'menu') {
    return (
      <button type="button" onClick={toggle} disabled={pending} className={btn('secondary', 'sm')}>
        {pending ? 'Saving…' : featured ? '★ Featured brief' : '☆ Make featured brief'}
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
      className={`w-9 h-9 flex items-center justify-center rounded-full border backdrop-blur-md text-[15px] transition-colors disabled:opacity-50 ${
        featured
          ? 'bg-[var(--signal)] border-[var(--signal)] text-[#0A0A0A]'
          : 'bg-black/55 border-white/20 text-white hover:bg-black/75 hover:border-white/50'
      }`}
    >
      {featured ? '★' : '☆'}
    </button>
  );
}
