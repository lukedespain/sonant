'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAnonBriefs, clearAnonBriefs } from '@/lib/anon-briefs';
import { saveBrief } from '@/app/briefs/actions';

export default function BriefImporter() {
  const router = useRouter();
  const hasRun = useRef(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    // Guard: only ever run once per mount.
    if (hasRun.current) return;
    hasRun.current = true;

    const stashed = getAnonBriefs();
    if (stashed.length === 0) return;

    setImporting(true);

    (async () => {
      let savedCount = 0;
      for (const brief of stashed) {
        const result = await saveBrief({
          mode: brief.mode,
          target: brief.target,
          genres: brief.genres,
          moods: brief.moods,
          generatedContent: brief.generatedContent,
        });
        if (!result.error) savedCount += 1;
      }

      // Only clear the stash if everything imported cleanly.
      // If some failed, leave the stash so it retries next visit.
      if (savedCount === stashed.length) {
        clearAnonBriefs();
      }

      setImporting(false);

      if (savedCount > 0) {
        router.refresh();
      }
    })();
  }, [router]);

  if (!importing) return null;

  return (
    <div
      className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mb-8"
      style={{ borderRadius: '2px' }}
    >
      <div
        className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]"
        style={{ fontFamily: "var(--brand-mono)" }}
      >
        ◆ Importing your saved briefs…
      </div>
    </div>
  );
}