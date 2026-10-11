// A client brief is closed when an admin closed it (generated_content.closedAt)
// or when its free-text deadline parses to a day that has already passed.

export function parseDeadline(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const cleaned = raw.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1').trim();
  const time = Date.parse(cleaned);
  return Number.isNaN(time) ? null : new Date(time);
}

export function isBriefClosed(content: unknown, now = new Date()): boolean {
  const c = (content ?? {}) as { closedAt?: unknown; deadline?: unknown };
  if (typeof c.closedAt === 'string' && c.closedAt) return true;
  const due = parseDeadline(c.deadline);
  if (!due) return false;
  const endOfDue = new Date(due);
  endOfDue.setHours(23, 59, 59, 999);
  return endOfDue.getTime() < now.getTime();
}
