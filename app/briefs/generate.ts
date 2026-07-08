'use server';

import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_CATEGORIES,
  SCRUB_LIST,
  getActivePatterns,
} from '@/lib/brief-patterns';

// ============================================================
// TYPES
// ============================================================

interface Reference {
  track: string;
  like: string;
  avoid: string;
}

export interface Brief {
  mode: 'brand' | 'film' | 'games';
  codename: string;
  briefId: string;
  issued: string;
  deadline: string;
  client: string;
  classification: string;
  project: string;
  story: string;
  ask: string;
  direction: string[];
  references: Reference[];
  genrePalette: string;
  emotionalArc: string;
  tempo: string;
  key: string;
  length: string;
  vocals: string;
  imageUrl?: string;
}

export interface GenerateBriefInput {
  category: string;
  genres: string[];
  moods: string[];
  mode: 'brand' | 'film' | 'games';
  withVocals: boolean;
}

// ============================================================
// HELPERS
// ============================================================

const CODENAMES = [
  'MERIDIAN', 'NORTHSTAR', 'GRAVITY', 'EMBER', 'AURORA',
  'PARALLAX', 'LIGHTHOUSE', 'IRONCLAD', 'WAVEFORM', 'PHOENIX',
  'KINDRED', 'OBSIDIAN', 'SOLSTICE', 'HEARTLINE', 'BLACKBIRD',
  'CRESCENT', 'HALYARD', 'THISTLE', 'DOVETAIL', 'COASTLINE',
  'NIGHTSHIFT', 'COLD OPEN', 'SLOW TIDE', 'AFTERGLOW', 'IRONWOOD',
];

function pickCodename(): string {
  return CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
}

function makeBriefId(): string {
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `BR-2026-${num}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function deadlineFormatted(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function lengthForMode(mode: 'brand' | 'film' | 'games'): string {
  if (mode === 'film') return '60-120 seconds';
  if (mode === 'games') return '30-60 seconds (loopable)';
  return '15-30 seconds';
}

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildSystemPrompt(): string {
  const activePatterns = getActivePatterns();

  const patternDescriptions = activePatterns
    .map(
      (p) => `**${p.name}**
- ${p.description}
- When to deploy: ${p.whenToDeploy}
- Sub-patterns: ${p.subPatterns.slice(0, 3).join('; ')}
- Anti-patterns: ${p.antiPatterns.slice(0, 2).join('; ')}`
    )
    .join('\n\n');

  const scrubInstructions = `NEVER include these in any brief:
- Real studios: ${SCRUB_LIST.studios.join(', ')}
- Real platforms: ${SCRUB_LIST.platforms.join(', ')}
- Real people: ${SCRUB_LIST.realPeople.join(', ')}
- Real brands: ${SCRUB_LIST.realBrands.join(', ')}`;

  return `You are a music supervisor at Sonant Studio writing briefs for composers to practice sync writing.

Output is a JSON object matching the schema in the user message. Every field required. Return only valid JSON.

Write like a working professional preparing a real brief. Specific, human, concise. No AI filler. No corporate language. Trust the composer.

# CREATIVE PATTERNS

Deploy 3-5 of these naturally per brief based on the category and concept. Do not label or list them in the output.

${patternDescriptions}

# RULES

1. Invent a fictional brand or client name appropriate to the category. No real brands. Vary the register — not every sports brand is heavy and gritty, not every tech brand is minimal and clean. Draw from the seed pool and invent beyond it freely.

2. The "project" field is a short campaign label only — 3 to 5 words. No platforms, no distribution details, no comma-separated secondary clause after the core label.

3. "story" is The Scene — 3 to 4 sentences. Visual, immediate, cinematic. What is happening in the world of this brief. Short, varied sentence rhythm. No demographic breakdowns or brand history.

4. "ask" is The Music — 4 to 5 sentences. What this track needs to do emotionally. The sonic approach. What makes it hard to execute well. This is the heart of the brief.

5. "direction" is 4 to 5 punchy bullets. One specific idea per bullet. Direct and actionable. Avoid starting every bullet with the same word.

6. "references" is exactly 2 entries. "track" format: "Artist Name, Track Title" (comma separator). "like": one specific thing to borrow — energy, texture, or structure. "avoid": one specific thing NOT to imitate. One sentence each. No em dashes.

7. No em dashes anywhere in the brief. Use commas, periods, or parentheses instead.

8. Write "tempo" as a BPM range with a plain hyphen: "95-115 BPM". No en dash.

9. Be concise. One clear idea per sentence. Avoid over-explaining.

10. Every choice must fit the established genre and mood. Coherence over novelty.

${scrubInstructions}`;
}

function buildUserPrompt(input: GenerateBriefInput): string {
  const category = BRAND_CATEGORIES[input.category];
  if (!category) throw new Error(`Unknown category: ${input.category}`);

  const briefId = makeBriefId();
  const issued = todayFormatted();
  const deadline = deadlineFormatted();
  const classification = `${input.category} / ${input.mode === 'brand' ? 'Brand' : input.mode === 'film' ? 'Film' : 'Games'}`;
  const length = lengthForMode(input.mode);
  const vocals = input.withVocals ? 'Vocal' : 'Instrumental';

  return `Generate a music brief with the following parameters.

**Category:** ${category.name}
**Default Register:** ${category.defaultRegister}
**Failure Modes to Avoid:** ${category.failureModesToAvoid.join('; ')}
**Fictional Brand Seeds (inspiration only — invent your own or pick from these):** ${category.fictionalBrandSeeds.join(', ')}
**Register Notes:** ${category.registerNotes}

**Genre Palette:** ${input.genres.join(', ')}
**Emotional Arc:** ${input.moods.join(', ')}
**Track Type:** ${vocals}

**Codename:** Invent a fresh 1-2 word project codename. Should evoke the genre and mood, not the brand category. Examples: "Nightshift", "Paper Lanterns", "Cold Open", "Slow Tide", "Afterglow", "Ironwood". No real trademarks. Make it specific to this brief's mood. Vary it so generated briefs rarely repeat.

**Pre-generated metadata — use these values exactly:**
- mode: "${input.mode}"
- briefId: "${briefId}"
- issued: "${issued}"
- deadline: "${deadline}"
- classification: "${classification}"
- genrePalette: "${input.genres.join(', ')}"
- emotionalArc: "${input.moods.join(', ')}"
- length: "${length}"
- vocals: "${vocals}"

Return ONLY a valid JSON object. No preamble, no markdown fences, no explanation. Begin with { and end with }.

{
  "mode": "${input.mode}",
  "codename": "<1-2 word project codename evoking the genre and mood>",
  "briefId": "${briefId}",
  "issued": "${issued}",
  "deadline": "${deadline}",
  "client": "<fictional brand name appropriate to the category>",
  "classification": "${classification}",
  "project": "<3-5 word campaign label only — no platforms, no distribution details>",
  "story": "<3-4 visual, cinematic sentences describing the scene or world of this brief>",
  "ask": "<4-5 sentences about what this track needs to do emotionally, sonically, and what makes it hard to execute>",
  "direction": [
    "<specific actionable direction — one idea per bullet>",
    "<specific actionable direction>",
    "<specific actionable direction>",
    "<specific actionable direction>",
    "<specific actionable direction>"
  ],
  "references": [
    {
      "track": "<Artist Name, Track Title>",
      "like": "<one specific thing to borrow from this reference, 1 sentence>",
      "avoid": "<one specific thing NOT to imitate, 1 sentence>"
    },
    {
      "track": "<Artist Name, Track Title>",
      "like": "<one specific thing to borrow from this reference, 1 sentence>",
      "avoid": "<one specific thing NOT to imitate, 1 sentence>"
    }
  ],
  "genrePalette": "${input.genres.join(', ')}",
  "emotionalArc": "${input.moods.join(', ')}",
  "tempo": "<XX-XX BPM using a plain hyphen>",
  "key": "<musical key guidance>",
  "length": "${length}",
  "vocals": "${vocals}"
}`;
}

// ============================================================
// PUNCTUATION SCRUB — strip em/en dashes from all prose fields
// ============================================================

function scrubDashes(text: string): string {
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/—|–/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .trim();
}

function scrubBrief(brief: Brief): Brief {
  const s = scrubDashes;
  return {
    ...brief,
    project: s(brief.project),
    story: s(brief.story),
    ask: s(brief.ask),
    direction: brief.direction.map(s),
    references: brief.references.map((r) => ({
      track: s(r.track),
      like: s(r.like),
      avoid: s(r.avoid),
    })),
    genrePalette: s(brief.genrePalette),
    emotionalArc: s(brief.emotionalArc),
    tempo: s(brief.tempo),
    key: s(brief.key),
    vocals: s(brief.vocals),
  };
}

// ============================================================
// JSON EXTRACTION + VALIDATION
// ============================================================

function extractJsonObject(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return text.trim();
  return text.slice(firstBrace, lastBrace + 1).trim();
}

function validateBrief(obj: unknown): string[] {
  const problems: string[] = [];
  if (typeof obj !== 'object' || obj === null) return ['Parsed value is not an object.'];
  const b = obj as Record<string, unknown>;

  const requiredStrings = [
    'mode', 'codename', 'briefId', 'issued', 'deadline', 'client',
    'classification', 'project', 'story', 'ask', 'genrePalette',
    'emotionalArc', 'tempo', 'key', 'length', 'vocals',
  ];
  for (const field of requiredStrings) {
    if (typeof b[field] !== 'string' || !(b[field] as string).trim()) {
      problems.push(`Missing or empty field: ${field}`);
    }
  }

  if (!Array.isArray(b.direction) || b.direction.length === 0) {
    problems.push('Missing or empty array: direction');
  }

  if (!Array.isArray(b.references) || b.references.length < 2) {
    problems.push('References must have at least 2 entries');
  } else {
    for (const r of b.references as unknown[]) {
      const rr = r as Record<string, unknown>;
      if (typeof rr?.track !== 'string' || typeof rr?.like !== 'string' || typeof rr?.avoid !== 'string') {
        problems.push('A reference entry is missing track, like, or avoid.');
        break;
      }
    }
  }

  return problems;
}

// ============================================================
// SERVER ACTION
// ============================================================

export async function generateBrief(
  input: GenerateBriefInput
): Promise<{ brief?: Brief; error?: string }> {
  if (!BRAND_CATEGORIES[input.category]) {
    return { error: `Unknown category: ${input.category}` };
  }

  if (input.genres.length === 0 || input.moods.length === 0) {
    return { error: 'Please select at least one genre and one mood.' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set.');
    return { error: 'Brief generation is temporarily unavailable. Please try again later.' };
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt();
  const baseUserPrompt = buildUserPrompt(input);

  async function attemptGeneration(
    attemptNumber: number
  ): Promise<{ brief?: Brief; failReason?: string }> {
    const userPrompt =
      attemptNumber === 1
        ? baseUserPrompt
        : baseUserPrompt +
          '\n\nIMPORTANT: Return ONLY the JSON object. Complete, valid, parseable JSON with every field present. No preamble, no markdown, no trailing text.';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (response.stop_reason === 'max_tokens') {
      console.error(`Attempt ${attemptNumber}: truncated`);
      return { failReason: 'truncated' };
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error(`Attempt ${attemptNumber}: no text block`);
      return { failReason: 'no-text-block' };
    }

    const raw = extractJsonObject(textBlock.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error(`Attempt ${attemptNumber}: parse error`, e);
      return { failReason: 'parse-error' };
    }

    const problems = validateBrief(parsed);
    if (problems.length > 0) {
      console.error(`Attempt ${attemptNumber}: schema invalid`, problems);
      return { failReason: 'schema-invalid' };
    }

    return { brief: scrubBrief(parsed as Brief) };
  }

  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await attemptGeneration(attempt);
      if (result.brief) {
        if (attempt > 1) console.log(`Generator succeeded on attempt ${attempt}.`);
        return { brief: result.brief };
      }
    }
    return { error: 'Generator returned invalid format. Please try again.' };
  } catch (apiError) {
    console.error('Anthropic API error:', apiError);
    const message = apiError instanceof Error ? apiError.message : 'Unknown error';
    if (message.includes('rate_limit')) return { error: 'Rate limit reached. Please try again in a minute.' };
    if (message.includes('credit')) return { error: 'Generation service temporarily unavailable.' };
    return { error: 'Brief generation failed. Please try again.' };
  }
}
