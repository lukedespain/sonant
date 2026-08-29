const FALLBACK_INBOX = process.env.DISCO_INBOX_URL?.trim() || '';

export function resolveDiscoInboxUrl(briefInboxUrl: string | null | undefined): string | null {
  const fromBrief = briefInboxUrl?.trim() || '';
  const url = fromBrief || FALLBACK_INBOX;
  return url || null;
}

export function isClientBriefRecord(brief: {
  brief_type?: string | null;
  generated_content?: unknown;
}): boolean {
  const content = brief.generated_content as { kind?: string } | null | undefined;
  return brief.brief_type === 'client' || content?.kind === 'client';
}
