'use client';

import { useRouter } from 'next/navigation';
import { moveBriefToPractice } from '@/app/briefs/actions';
import ConfirmActionButton from '@/components/ConfirmActionButton';

export default function MoveToPracticeButton({ briefId }: { briefId: string }) {
  const router = useRouter();
  return (
    <ConfirmActionButton
      label="↓ Move to practice"
      confirmLabel="Move it? Link stays live"
      pendingLabel="Moving…"
      onConfirm={async () => {
        const result = await moveBriefToPractice(briefId);
        if (result.error) return result.error;
        router.refresh();
        return null;
      }}
    />
  );
}
