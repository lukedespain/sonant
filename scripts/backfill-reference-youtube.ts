import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { isYouTubeUrl, youtubeUrlForReferenceTrack } from '../lib/music-lookup';

function loadEnv() {
  return Object.fromEntries(
    readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i).trim(), v];
      })
  );
}

async function main() {
  const env = loadEnv();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: briefs, error } = await admin
    .from('briefs')
    .select('id, generated_content')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const report: Array<{ id: string; track: string; from: string | null; to: string | null }> = [];

  for (const row of briefs ?? []) {
    const content = (row.generated_content ?? {}) as {
      references?: { track?: string; url?: string; [key: string]: unknown }[];
    };
    const refs = content.references ?? [];
    if (refs.length === 0) continue;

    let changed = false;
    const nextRefs = [];
    for (const ref of refs) {
      const track = typeof ref.track === 'string' ? ref.track.trim() : '';
      const current = typeof ref.url === 'string' ? ref.url : null;
      if (!track) {
        nextRefs.push(ref);
        continue;
      }
      if (isYouTubeUrl(current) && /watch\?v=|youtu\.be\//i.test(current ?? '')) {
        nextRefs.push(ref);
        continue;
      }
      process.stdout.write(`lookup ${track}\n`);
      const youtube = await youtubeUrlForReferenceTrack(track);
      process.stdout.write(`  -> ${youtube}\n`);
      report.push({ id: row.id, track, from: current, to: youtube });
      if (youtube && youtube !== current) {
        nextRefs.push({ ...ref, url: youtube });
        changed = true;
      } else {
        nextRefs.push(ref);
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!changed) continue;
    const { error: updateError } = await admin
      .from('briefs')
      .update({ generated_content: { ...content, references: nextRefs } })
      .eq('id', row.id);
    if (updateError) {
      console.error('update failed', row.id, updateError.message);
    }
  }

  console.log(JSON.stringify({ updated: report.filter((r) => r.to && r.to !== r.from).length, report }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
