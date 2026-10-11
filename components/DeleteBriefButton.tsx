'use client';

import { useRouter } from 'next/navigation';
import { deleteBrief } from '@/app/briefs/actions';
import ConfirmActionButton from '@/components/ConfirmActionButton';

export default function DeleteBriefButton({
  briefId,
  redirectPath = '/library',
  canMoveToPractice = false,
}: {
  briefId: string;
  redirectPath?: string;
  canMoveToPractice?: boolean;
}) {
  const router = useRouter();
  return (
    <ConfirmActionButton
      danger
      label="Delete"
      confirmLabel="Delete for good"
      pendingLabel="Deleting…"
      onConfirm={async () => {
        const result = await deleteBrief(briefId);
        if (result.error) {
          return result.hasActivity && canMoveToPractice
            ? `${result.error} Move it to practice instead.`
            : result.error;
        }
        router.push(redirectPath);
        router.refresh();
        return null;
      }}
    />
  );
}
