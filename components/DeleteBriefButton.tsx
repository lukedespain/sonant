'use client';

import { deleteBrief } from '@/app/briefs/actions';

export default function DeleteBriefButton({
  briefId,
  redirectPath,
}: {
  briefId: string;
  redirectPath?: string;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm('Delete this brief? This cannot be undone.')) e.preventDefault();
  }

  return (
    <form action={deleteBrief} onSubmit={handleSubmit}>
      <input type="hidden" name="briefId" value={briefId} />
      {redirectPath && <input type="hidden" name="redirectPath" value={redirectPath} />}
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
