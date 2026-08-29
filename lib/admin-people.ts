import type { VerifiedOverride } from '@/lib/verification';

export type AdminPerson = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  submissionCredits: number;
  sessionCredits: number;
  acceptedOnBriefs: number;
  manualPlacements: number;
  accepted: number;
  override: VerifiedOverride;
  verified: boolean;
};
