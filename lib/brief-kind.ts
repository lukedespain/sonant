import { ADMIN_USER_ID } from '@/lib/admin-ids';

export type BriefKind = 'community' | 'catalog' | 'client';

export function classifyBrief(brief: {
  brief_type?: string | null;
  user_id?: string | null;
  generated_content?: unknown;
}): BriefKind {
  const content = brief.generated_content as { kind?: string } | null | undefined;
  if (brief.brief_type === 'client' || content?.kind === 'client') return 'client';
  if (brief.brief_type === 'catalog' || brief.user_id === ADMIN_USER_ID) return 'catalog';
  return 'community';
}

export const BRIEF_KIND_LABEL: Record<BriefKind, string> = {
  community: 'Community',
  catalog: 'Catalog',
  client: 'Client',
};
