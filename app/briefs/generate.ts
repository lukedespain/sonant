'use server';

import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_CATEGORIES,
  FILM_CATEGORIES,
  GAMES_CATEGORIES,
  SCRUB_LIST,
  getActivePatterns,
  type CategoryMeta,
} from '@/lib/brief-patterns';

function getCategoriesForMode(mode: 'brand' | 'film' | 'games'): Record<string, CategoryMeta> {
  if (mode === 'film') return FILM_CATEGORIES;
  if (mode === 'games') return GAMES_CATEGORIES;
  return BRAND_CATEGORIES;
}

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

function buildSystemPrompt(mode: 'brand' | 'film' | 'games'): string {
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

  const roleIntro =
    mode === 'film'
      ? 'You are a music supervisor at Sonant Studio writing briefs for composers to practice scoring film and television cues.'
      : mode === 'games'
      ? 'You are a game audio director at Sonant Studio writing briefs for composers to practice writing game music.'
      : 'You are a music supervisor at Sonant Studio writing briefs for composers to practice sync writing.';

  const modeRule =
    mode === 'games'
      ? '\n11. The track must loop seamlessly. Mention the loop requirement naturally in "ask" — one sentence on loop point invisibility or seamless cycling. Do not make it the entire focus.'
      : mode === 'film'
      ? '\n11. Write the scene description in "story" as a director or script supervisor would — what is visible on screen, not brand or marketing language. No demographic copy.'
      : '';

  return `${roleIntro}

Output is a JSON object matching the schema in the user message. Every field required. Return only valid JSON.

Write like a working professional preparing a real brief. Specific, human, concise. No AI filler. No corporate language. Trust the composer.

# CREATIVE PATTERNS

Deploy 3-5 of these naturally per brief based on the category and concept. Do not label or list them in the output.

${patternDescriptions}

# RULES

1. Invent a fictional ${mode === 'film' ? 'production company' : mode === 'games' ? 'game studio' : 'brand or client'} name appropriate to the category. No real ${mode === 'brand' ? 'brands' : 'studio or publisher names'}. Draw from the seed pool and invent beyond it freely.

2. The "project" field is ${mode === 'film' ? 'a short film or series title — 2 to 4 words' : mode === 'games' ? 'a short game title or feature label — 2 to 4 words' : 'a short campaign label only — 3 to 5 words. No platforms, no distribution details'}.

3. "story" is The Scene — 3 to 4 sentences. ${mode === 'film' ? 'Describe what is happening on screen: specific visual action, setting, character behavior. Cinematic and immediate. This is a scene description, not brand copy.' : mode === 'games' ? 'Describe the in-game moment or world context: what the player sees, where they are, the atmosphere. Specific and immersive.' : 'Visual, immediate, cinematic. What is happening in the world of this brief. Short, varied sentence rhythm. No demographic breakdowns or brand history.'}

4. "ask" is The Music — 4 to 5 sentences. What this ${mode === 'film' ? 'cue' : mode === 'games' ? 'game track' : 'track'} needs to do emotionally. The sonic approach. What makes it hard to execute well. This is the heart of the brief.

5. "direction" is 4 to 5 punchy bullets. One specific idea per bullet. Direct and actionable. Avoid starting every bullet with the same word.

6. "references" is exactly 2 entries. "track" format: "Artist Name, Track Title" (comma separator). ${mode === 'film' ? 'Use film score composers and tracks where appropriate (e.g. Jonny Greenwood, Nico Muhly, Johann Johannsson, Ryuichi Sakamoto, Ennio Morricone, Bernard Herrmann, or relevant contemporary artists).' : mode === 'games' ? 'Use game composers and OST tracks where appropriate (e.g. Disasterpeace, Darren Korb, Austin Wintory, Jesper Kyd, Yoko Shimomura, or relevant artists).' : ''} "like": one specific thing to borrow. "avoid": one specific thing NOT to imitate. One sentence each. No em dashes.

7. No em dashes anywhere in the brief. Use commas, periods, or parentheses instead.

8. Write "tempo" as a BPM range with a plain hyphen: "95-115 BPM". No en dash.

9. Be concise. One clear idea per sentence. Avoid over-explaining.

10. Every choice must fit the established genre and mood. Coherence over novelty.
${modeRule}

${scrubInstructions}`;
}

function buildUserPrompt(input: GenerateBriefInput): string {
  const categories = getCategoriesForMode(input.mode);
  const category = categories[input.category];
  if (!category) throw new Error(`Unknown category: ${input.category}`);

  const briefId = makeBriefId();
  const issued = todayFormatted();
  const deadline = deadlineFormatted();
  const classification = `${input.category} / ${input.mode === 'brand' ? 'Brand' : input.mode === 'film' ? 'Film' : 'Games'}`;
  const length = lengthForMode(input.mode);
  const vocals = input.withVocals ? 'Vocal' : 'Instrumental';

  const categoryBlock =
    input.mode === 'film'
      ? `**Scene Type:** ${category.name}
**Typical Register:** ${category.defaultRegister}
**Common Failure Modes:** ${category.failureModesToAvoid.join('; ')}
**Fictional Production Companies (inspiration only — invent your own):** ${category.fictionalBrandSeeds.join(', ')}
**Scene Notes:** ${category.registerNotes}`
      : input.mode === 'games'
      ? `**Game Context:** ${category.name}
**Audio Register:** ${category.defaultRegister}
**Common Failure Modes:** ${category.failureModesToAvoid.join('; ')}
**Fictional Game Studios (inspiration only — invent your own):** ${category.fictionalBrandSeeds.join(', ')}
**Context Notes:** ${category.registerNotes}`
      : `**Category:** ${category.name}
**Default Register:** ${category.defaultRegister}
**Failure Modes to Avoid:** ${category.failureModesToAvoid.join('; ')}
**Fictional Brand Seeds (inspiration only — invent your own or pick from these):** ${category.fictionalBrandSeeds.join(', ')}
**Register Notes:** ${category.registerNotes}`;

  const codenameInstruction =
    input.mode === 'film'
      ? `**Codename:** Invent a cinematic 1-2 word cue title evoking the scene and mood. Should sound like a real film score cue name. Examples: "First Light", "Last Train", "The Weight of It", "Threshold", "Burning Low", "Cold Open", "Still Water", "The Long Road". Specific to this brief's emotional register.`
      : input.mode === 'games'
      ? `**Codename:** Invent a 1-2 word game audio cue title that fits the game world and context. Should sound like a real game OST track name. Examples: "Ironhold", "The Breach", "Ancient Path", "Final Descent", "Ember Core", "Ashveil", "Threshold Run", "The Hollow". Specific to this brief's context and world.`
      : `**Codename:** Invent a fresh 1-2 word project codename. Should evoke the genre and mood, not the brand category. Examples: "Nightshift", "Paper Lanterns", "Cold Open", "Slow Tide", "Afterglow", "Ironwood". No real trademarks. Make it specific to this brief's mood. Vary it so generated briefs rarely repeat.`;

  const clientDesc =
    input.mode === 'film'
      ? '<fictional production company or streaming studio name>'
      : input.mode === 'games'
      ? '<fictional game studio name>'
      : '<fictional brand name appropriate to the category>';

  const projectDesc =
    input.mode === 'film'
      ? '<2-4 word film or series title>'
      : input.mode === 'games'
      ? '<2-4 word game title or scene label>'
      : '<3-5 word campaign label only — no platforms, no distribution details>';

  const storyDesc =
    input.mode === 'film'
      ? '<3-4 sentences describing what is happening on screen: specific visual action, setting, character behavior. Cinematic and immediate — this is a scene description, not marketing copy>'
      : input.mode === 'games'
      ? '<3-4 sentences describing the in-game moment or world context: what the player sees, where they are, the game atmosphere>'
      : '<3-4 visual, cinematic sentences describing the scene or world of this brief>';

  const askDesc =
    input.mode === 'games'
      ? '<4-5 sentences about what this track needs to do emotionally and sonically, including one sentence on why seamless looping matters here and what makes it hard to execute>'
      : '<4-5 sentences about what this track needs to do emotionally, sonically, and what makes it hard to execute>';

  return `Generate a music brief with the following parameters.

${categoryBlock}

**Genre Palette:** ${input.genres.join(', ')}
**Emotional Arc:** ${input.moods.join(', ')}
**Track Type:** ${vocals}

${codenameInstruction}

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
  "codename": "<1-2 word codename>",
  "briefId": "${briefId}",
  "issued": "${issued}",
  "deadline": "${deadline}",
  "client": "${clientDesc}",
  "classification": "${classification}",
  "project": "${projectDesc}",
  "story": "${storyDesc}",
  "ask": "${askDesc}",
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
  if (!getCategoriesForMode(input.mode)[input.category]) {
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
  const systemPrompt = buildSystemPrompt(input.mode);
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
