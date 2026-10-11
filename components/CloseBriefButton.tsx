'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setBriefClosed } from '@/app/briefs/actions';
import { btn } from '@/components/ui';

export default function CloseBriefButton({ briefId, closed }: { briefId: string; closed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await setBriefClosed(briefId, !closed);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className={btn('secondary', 'sm')}
      >
        {pending ? 'Saving…' : closed ? 'Reopen brief' : 'Close brief'}
      </button>
      {error && <p role="alert" className="text-xs text-[#FF8B6B] px-1">{error}</p>}
    </>
  );
}
