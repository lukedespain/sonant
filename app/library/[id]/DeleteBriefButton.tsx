'use client';

import { deleteBrief } from '@/app/briefs/actions';

// Delete control for a saved brief. Destructive, so it asks for
// confirmation before the server action runs. Styled to read as a
// destructive action: quiet at rest, red-tinted on hover, distinct
// from the orange safe actions next to it.
export default function DeleteBriefButton({ briefId }: { briefId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const ok = window.confirm(
      'Delete this brief? This cannot be undone.'
    );
    if (!ok) {
      e.preventDefault();
    }
  }

  return (
    <form action={deleteBrief} onSubmit={handleSubmit}>
      <input type="hidden" name="briefId" value={briefId} />
      <button
        type="submit"
        className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#4A3633] text-[#9A8A86] hover:border-[#C5564A] hover:text-[#C5564A] transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
      >
        Delete
      </button>
    </form>
  );
}
