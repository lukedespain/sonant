import Anthropic from '@anthropic-ai/sdk';
import type { Brief, BriefLink, Reference } from '@/components/BriefDocument';

export type ClientBriefInput = {
  sourceText: string;
  clientName: string;
  projectTitle: string;
  dueDate: string;
  winFee: string;
  demoFee: string;
  files: {
    name: string;
    mediaType: string;
    base64: string;
    kind: 'image' | 'pdf' | 'text';
    text?: string;
  }[];
};

function makeBriefId(): string {
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `CB-2026-${num}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function scrubDashes(text: string): string {
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/—|–/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .trim();
}

function extractJsonObject(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return text.trim();
  return text.slice(firstBrace, lastBrace + 1).trim();
}

function extractUrls(text: string): BriefLink[] {
  const matches = text.match(/https?:\/\/[^\s)\]>'"]+/gi) ?? [];
  const seen = new Set<string>();
  const links: BriefLink[] = [];
  for (const raw of matches) {
    const url = raw.replace(/[.,;:]+$/, '');
    if (seen.has(url) || url.includes('...')) continue;
    seen.add(url);
    const lower = url.toLowerCase();
    let label = 'Link';
    if (lower.includes('youtu')) label = 'Reference video';
    else if (lower.includes('disco.ac') || lower.includes('dropbox') || lower.includes('frame.io') || lower.includes('vimeo')) {
      label = 'Picture to score';
    } else if (lower.includes('spotify') || lower.includes('soundcloud') || lower.includes('bandcamp')) {
      label = 'Reference audio';
    }
    links.push({ label, url });
  }
  return links;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? scrubDashes(value) : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(scrubDashes);
  return items.length > 0 ? items : fallback;
}

function asLinks(value: unknown): BriefLink[] {
  if (!Array.isArray(value)) return [];
  const links: BriefLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    if (!/^https?:\/\//i.test(url)) continue;
    const label = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : 'Link';
    links.push({ label: scrubDashes(label), url });
  }
  return links;
}

function mergeLinks(primary: BriefLink[], extra: BriefLink[]): BriefLink[] {
  const seen = new Set(primary.map((l) => l.url));
  const merged = [...primary];
  for (const link of extra) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    merged.push(link);
  }
  return merged;
}

function asReferences(value: unknown, fallbackLinks: BriefLink[]): Reference[] {
  const refs: Reference[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const track = typeof row.track === 'string' ? scrubDashes(row.track) : '';
      if (!track) continue;
      const url = typeof row.url === 'string' && /^https?:\/\//i.test(row.url) ? row.url.trim() : undefined;
      refs.push({
        track,
        like: typeof row.like === 'string' ? scrubDashes(row.like) : undefined,
        avoid: typeof row.avoid === 'string' ? scrubDashes(row.avoid) : undefined,
        url,
      });
    }
  }
  if (refs.length === 0) {
    for (const link of fallbackLinks.filter((l) => l.label.toLowerCase().includes('reference'))) {
      refs.push({ track: link.label, url: link.url });
    }
  }
  return attachUrlsToReferences(refs, fallbackLinks);
}

function attachUrlsToReferences(refs: Reference[], links: BriefLink[]): Reference[] {
  const used = new Set(refs.map((r) => r.url).filter((u): u is string => Boolean(u)));
  return refs.map((ref) => {
    if (ref.url) return ref;
    const match = links.find((l) => {
      if (used.has(l.url)) return false;
      const label = l.label.toLowerCase();
      return label.includes('reference') || label.includes('audio') || label.includes('video');
    });
    if (!match) return ref;
    used.add(match.url);
    return { ...ref, url: match.url };
  });
}

export async function generateClientBrief(
  input: ClientBriefInput
): Promise<{ brief?: Brief; genres?: string[]; moods?: string[]; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: 'Brief generation is temporarily unavailable.' };
  }

  const clientName = input.clientName.trim();
  const projectTitle = input.projectTitle.trim();
  if (!clientName) {
    return { error: 'Add a client name.' };
  }
  if (!input.sourceText.trim() && input.files.length === 0) {
    return { error: 'Paste the brief or upload a file.' };
  }

  const issued = todayFormatted();
  const briefId = makeBriefId();
  const title = projectTitle || clientName;
  const sourceUrls = extractUrls(
    [input.sourceText, ...input.files.map((f) => f.text ?? '')].join('\n')
  );

  const textFiles = input.files.filter((f) => f.kind === 'text' && f.text).map((f) => `--- ${f.name} ---\n${f.text}`);
  const sourceNotes = [
    input.sourceText.trim() && `PASTED SOURCE:\n${input.sourceText.trim()}`,
    textFiles.length > 0 && `EXTRACTED FROM DOCUMENTS:\n${textFiles.join('\n\n')}`,
  ].filter(Boolean).join('\n\n');

  const userText = `Turn the attached client materials into a Sonant music brief.

This is a REAL paid client brief. Keep the client's intent. Do not invent a different client or campaign.

Use these names exactly:
- Client name: ${clientName}
- Project title: ${title}
- Due date: ${input.dueDate.trim() || 'not specified'}
- Demo fee: ${input.demoFee.trim() || 'not specified'}
- Win fee: ${input.winFee.trim() || 'not specified'}

Pull every URL from the source into "links". Label video-to-score / picture files as "Picture to score". Label YouTube, Spotify, or named tracks as "Reference".

For each named reference, describe only what is on that recording. If the source does not say the track has strings, brass, or a big build, do not invent them. "like" and "avoid" should name actual instruments, vocal treatment, or production.

Write in the Sonant voice: specific, human, concise. No AI filler. No em dashes.

Return ONLY a JSON object:
{
  "mode": "brand" | "film" | "games",
  "classification": "<short category>",
  "project": "<one sentence on what the job is>",
  "story": "<the scene / picture / world, 2-4 sentences>",
  "ask": "<what the music needs to do, 2-4 sentences>",
  "direction": ["<specific direction>", "<specific direction>", "<specific direction>"],
  "references": [
    { "track": "<Artist, Title>", "like": "<what to borrow>", "avoid": "<what not to imitate>", "url": "<if a link exists>" }
  ],
  "links": [
    { "label": "<Picture to score | Reference | Download>", "url": "<https://...>" }
  ],
  "genrePalette": "<comma-separated genres>",
  "emotionalArc": "<comma-separated moods>",
  "tempo": "<XX-XX BPM using a plain hyphen>",
  "key": "<musical key guidance>",
  "length": "<durations needed>",
  "vocals": "<instrumental or vocal guidance>",
  "genres": ["<genre>"],
  "moods": ["<mood>"]
}
${sourceNotes ? `\n${sourceNotes}` : ''}`;

  const content: Anthropic.ContentBlockParam[] = [];

  for (const file of input.files) {
    if (file.kind === 'image') {
      const mediaType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mediaType)
        ? file.mediaType
        : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: file.base64 },
      });
    }
    if (file.kind === 'pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: file.base64 },
      });
    }
  }

  content.push({ type: 'text', text: userText });

  const anthropic = new Anthropic({ apiKey });

  async function runOnce(extra?: string) {
    const parts = extra
      ? [...content, { type: 'text' as const, text: extra }]
      : content;
    return anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      system:
        'You are a music supervisor at Sonant rewriting a real client brief into the Sonant brief format. Keep the client\'s facts. Output valid JSON only. Always include every URL from the source in links.',
      messages: [{ role: 'user', content: parts }],
    });
  }

  try {
    let parsed: Record<string, unknown> | null = null;
    let rawText = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await runOnce(
        attempt === 2 ? 'Return ONLY complete valid JSON. Every required field filled. Include all URLs in links.' : undefined
      );
      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') continue;
      rawText = textBlock.text;
      try {
        parsed = JSON.parse(extractJsonObject(textBlock.text)) as Record<string, unknown>;
        break;
      } catch (err) {
        console.error(`Client brief parse error on attempt ${attempt}`, err);
      }
    }

    const p = parsed ?? {};
    const mode = ['brand', 'film', 'games'].includes(p.mode as string) ? (p.mode as Brief['mode']) : 'brand';
    const links = mergeLinks(asLinks(p.links), mergeLinks(sourceUrls, extractUrls(rawText)));
    const references = asReferences(p.references, links);
    const genres = asStringArray(p.genres, asString(p.genrePalette, 'Electronic').split(',').map((g) => g.trim()).filter(Boolean));
    const moods = asStringArray(p.moods, asString(p.emotionalArc, 'Driving').split(',').map((g) => g.trim()).filter(Boolean));

    const brief: Brief = {
      mode,
      codename: title,
      projectTitle: title,
      briefId,
      issued,
      deadline: input.dueDate.trim() || undefined,
      client: clientName,
      classification: asString(p.classification, mode === 'film' ? 'Film' : mode === 'games' ? 'Games' : 'Brand'),
      project: asString(p.project, title),
      story: asString(p.story, input.sourceText.trim().slice(0, 600) || 'See the attached client materials and picture.'),
      ask: asString(p.ask, 'Write to the attached picture and references. Keep it in the world of the client, not a generic trailer cue.'),
      direction: asStringArray(p.direction, ['Stay close to the picture.', 'Use the listed references as the lane, not a copy.']),
      references,
      links,
      genrePalette: asString(p.genrePalette, genres.join(', ') || 'Electronic'),
      emotionalArc: asString(p.emotionalArc, moods.join(', ') || 'Driving'),
      tempo: asString(p.tempo, 'Follow picture'),
      key: asString(p.key, 'Open'),
      length: asString(p.length, 'Match picture'),
      vocals: asString(p.vocals, 'Instrumental unless the picture asks otherwise'),
      kind: 'client',
      winFee: input.winFee.trim() || undefined,
      demoFee: input.demoFee.trim() || undefined,
    };

    return { brief, genres: genres.slice(0, 6), moods: moods.slice(0, 6) };
  } catch (apiError) {
    console.error('Client brief generation error:', apiError);
    const message = apiError instanceof Error ? apiError.message : '';
    if (message.includes('rate_limit')) return { error: 'Rate limit reached. Please try again in a minute.' };
    return { error: 'Brief generation failed. Please try again.' };
  }
}
