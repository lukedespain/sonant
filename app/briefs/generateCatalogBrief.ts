import Anthropic from '@anthropic-ai/sdk';
import type { Brief, Reference } from '@/components/BriefDocument';
import { DEFAULT_CATALOG_PARTNER_ID, catalogPartnerById } from '@/lib/partners';
import { youtubeSearchUrlForTrack } from '@/lib/youtube-search';

export type CatalogBriefInput = {
  sourceText: string;
  projectTitle: string;
  catalogId: string;
  files: {
    name: string;
    mediaType: string;
    base64: string;
    kind: 'image' | 'pdf' | 'text';
    text?: string;
  }[];
};

function makeBriefId(prefix: string): string {
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-2026-${num}`;
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

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? scrubDashes(value) : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(scrubDashes);
  return items.length > 0 ? items : fallback;
}

function asReferences(value: unknown): Reference[] {
  const refs: Reference[] = [];
  if (!Array.isArray(value)) return refs;
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const track = typeof row.track === 'string' ? scrubDashes(row.track) : '';
    if (!track) continue;
    refs.push({
      track,
      like: typeof row.like === 'string' ? scrubDashes(row.like) : undefined,
      avoid: typeof row.avoid === 'string' ? scrubDashes(row.avoid) : undefined,
    });
  }
  return refs;
}

export async function generateCatalogBrief(
  input: CatalogBriefInput
): Promise<{ brief?: Brief; genres?: string[]; moods?: string[]; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: 'Brief generation is temporarily unavailable.' };
  }

  const partner = catalogPartnerById(input.catalogId) ?? catalogPartnerById(DEFAULT_CATALOG_PARTNER_ID);
  if (!partner) {
    return { error: 'Unknown catalog.' };
  }
  const houseName = partner.name;

  const projectTitle = input.projectTitle.trim();
  if (!projectTitle) {
    return { error: 'Add a brief title.' };
  }
  if (!input.sourceText.trim() && input.files.length === 0) {
    return { error: 'Paste the brief or upload a file.' };
  }

  const issued = todayFormatted();
  const prefix = partner.id === 'thought-collective' ? 'TC' : 'CAT';
  const briefId = makeBriefId(prefix);

  const textFiles = input.files.filter((f) => f.kind === 'text' && f.text).map((f) => `--- ${f.name} ---\n${f.text}`);
  const sourceNotes = [
    input.sourceText.trim() && `PASTED SOURCE:\n${input.sourceText.trim()}`,
    textFiles.length > 0 && `EXTRACTED FROM DOCUMENTS:\n${textFiles.join('\n\n')}`,
  ].filter(Boolean).join('\n\n');

  const userText = `Turn the attached music-house notes into a Sonant catalog brief.

This is a REAL catalog need from ${partner.name}. They are looking for songs to pitch. Keep their intent, references, and vibe. Do not invent a different house, client, or campaign. Do not invent fees or a deadline.

Use these names exactly:
- Catalog house: ${partner.name}
- Brief title: ${projectTitle}

Do not include a files or links section. Do not use Spotify URLs.

For each named reference, describe only what is on that recording. If the source does not say the track has strings, brass, or a big build, do not invent them. "like" and "avoid" should name actual instruments, vocal treatment, or production. Leave reference urls empty. They will be filled with YouTube searches.

Write in the Sonant voice: specific, human, concise. No AI filler. No em dashes.

Return ONLY a JSON object:
{
  "mode": "brand" | "film" | "games",
  "classification": "<short category>",
  "project": "<one sentence on the kind of track they need>",
  "story": "<the world / use / picture this song lives in, 2-4 sentences>",
  "ask": "<what the music needs to do, 2-4 sentences>",
  "direction": ["<specific direction>", "<specific direction>", "<specific direction>"],
  "references": [
    { "track": "<Artist, Title>", "like": "<what to borrow>", "avoid": "<what not to imitate>" }
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
        `You are a music supervisor at Sonant rewriting a real catalog request from ${houseName} into the Sonant brief format. Keep their facts. Output valid JSON only. Do not include a links array. Do not use Spotify URLs.`,
      messages: [{ role: 'user', content: parts }],
    });
  }

  try {
    let parsed: Record<string, unknown> | null = null;
    let rawText = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await runOnce(
        attempt === 2 ? 'Return ONLY complete valid JSON. Every required field filled. No links array.' : undefined
      );
      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') continue;
      rawText = textBlock.text;
      try {
        parsed = JSON.parse(extractJsonObject(textBlock.text)) as Record<string, unknown>;
        break;
      } catch (err) {
        console.error(`Catalog brief parse error on attempt ${attempt}`, err);
      }
    }

    const p = parsed ?? {};
    const mode = ['brand', 'film', 'games'].includes(p.mode as string) ? (p.mode as Brief['mode']) : 'brand';
    const references = asReferences(p.references).map((ref) => ({
      ...ref,
      url: youtubeSearchUrlForTrack(ref.track),
    }));
    const genres = asStringArray(p.genres, asString(p.genrePalette, 'Hip-Hop').split(',').map((g) => g.trim()).filter(Boolean));
    const moods = asStringArray(p.moods, asString(p.emotionalArc, 'Playful').split(',').map((g) => g.trim()).filter(Boolean));

    const brief: Brief = {
      mode,
      codename: projectTitle,
      projectTitle,
      briefId,
      issued,
      client: partner.name,
      classification: asString(p.classification, mode === 'film' ? 'Film' : mode === 'games' ? 'Games' : 'Brand'),
      project: asString(p.project, projectTitle),
      story: asString(p.story, input.sourceText.trim().slice(0, 600) || 'See the attached catalog notes.'),
      ask: asString(p.ask, 'Write the track they asked for. Stay in their lane. Use the listed references as the world, not a copy.'),
      direction: asStringArray(p.direction, ['Stay close to the requested vibe.', 'Use the listed references as the lane, not a copy.']),
      references,
      genrePalette: asString(p.genrePalette, genres.join(', ') || 'Hip-Hop'),
      emotionalArc: asString(p.emotionalArc, moods.join(', ') || 'Playful'),
      tempo: asString(p.tempo, 'Follow the references'),
      key: asString(p.key, 'Open'),
      length: asString(p.length, 'Full song, radio-ready'),
      vocals: asString(p.vocals, 'Follow the brief'),
      kind: 'catalog',
      catalogId: partner.id,
    };

    return { brief, genres: genres.slice(0, 6), moods: moods.slice(0, 6) };
  } catch (apiError) {
    console.error('Catalog brief generation error:', apiError);
    const message = apiError instanceof Error ? apiError.message : '';
    if (message.includes('rate_limit')) return { error: 'Rate limit reached. Please try again in a minute.' };
    return { error: 'Brief generation failed. Please try again.' };
  }
}
