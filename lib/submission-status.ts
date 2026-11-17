import type { Tone } from '@/components/ui';

// Plain helpers (no 'use client'), so server pages and client components can both call them.

type StatusInput = { status: string; needsSignature?: boolean; briefType?: string };

export function isProject(sub: { briefType?: string }) {
  return sub.briefType === 'client';
}

export function composerStatus(
  sub: StatusInput,
): { label: string; tone: Tone; pulse?: boolean } {
  if (sub.briefType === 'client') {
    if (sub.status === 'accepted') return { label: 'Picked by the client', tone: 'positive' };
    if (sub.status === 'not_accepted') return { label: 'Not picked', tone: 'muted' };
    if (sub.status === 'sent_to_catalog') return { label: 'Sent to the client', tone: 'info' };
    return { label: 'With our team', tone: 'warning' };
  }
  if (sub.status === 'accepted') {
    return sub.needsSignature
      ? { label: 'Sign to finish', tone: 'signal', pulse: true }
      : { label: 'Accepted', tone: 'positive' };
  }
  if (sub.status === 'not_accepted') return { label: 'Not selected', tone: 'muted' };
  if (sub.status === 'sent_to_catalog') return { label: 'Shortlisted', tone: 'info' };
  if (sub.status === 'feedback_ready') return { label: 'Feedback ready', tone: 'info' };
  return { label: 'In review', tone: 'warning' };
}
