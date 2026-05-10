// app/briefs/generate.ts
//
// Server action that generates a Sonant brief using the Anthropic API.
// Consumes the pattern library from lib/brief-patterns.ts and returns
// a fully-shaped Brief object that matches the BriefDocument interface.
//
// This file runs server-side only. The Anthropic API key is never
// exposed to the browser.

'use server';

import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_CATEGORIES,
  PATTERNS,
  SCRUB_LIST,
  getActivePatterns,
} from '@/lib/brief-patterns';

// ============================================================
// TYPES (mirror the Brief interface from BriefDocument.tsx)
// ============================================================

interface Reference {
  track: string;
  why: string;
}

interface Consideration {
  label: string;
  body: string;
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
  deliverable: string;
  usage: string;
  greeting: string;
  story: string;
  ask: string;
  considerations: Consideration[];
  direction: string[];
  genrePalette: string;
  emotionalArc: string;
  references: Reference[];
  tempo: string;
  key: string;
  length: string;
  format: string;
  fileNaming: string;
  avoid: string[];
  deliverables: string[];
  terms: {
    fee: string;
    backend: string;
    exclusivity: string;
  };
  submitUrl: string;
}

// ============================================================
// INPUT (matches BriefGenerator's existing signature)
// ============================================================

export interface GenerateBriefInput {
  mode: 'brand' | 'film' | 'games';
  category: string;          // e.g., "SPIRITS", "AUTOMOTIVE"
  genres: string[];          // user-selected, 1-3 items
  moods: string[];           // user-selected, 1-3 items
}

// ============================================================
// CODENAME / BRIEF ID HELPERS
// ============================================================

const CODENAMES = [
  'MERIDIAN', 'NORTHSTAR', 'GRAVITY', 'EMBER', 'AURORA',
  'PARALLAX', 'LIGHTHOUSE', 'IRONCLAD', 'WAVEFORM', 'PHOENIX',
  'KINDRED', 'OBSIDIAN', 'SOLSTICE', 'HEARTLINE', 'BLACKBIRD',
  'CRESCENT', 'HALYARD', 'THISTLE', 'DOVETAIL', 'COASTLINE',
];

function pickCodename(): string {
  return CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
}

function makeBriefId(mode: string): string {
  const prefix = mode === 'brand' ? 'BR' : mode === 'film' ? 'FT' : 'GM';
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-2026-${num}`;
}

function todayIso(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function deadlineIso(daysOut: number): string {
  return new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
}

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildSystemPrompt(): string {
  const activePatterns = getActivePatterns();

  const patternDescriptions = activePatterns
    .map(
      (p) => `
**${p.name}** (Tier ${p.tier})
- ${p.description}
- When to deploy: ${p.whenToDeploy}
- Sub-patterns: ${p.subPatterns.join('; ')}
- Anti-patterns to avoid: ${p.antiPatterns.join('; ')}
- Example voice: ${p.exampleVoice.join(' / ')}
`
    )
    .join('\n');

  const scrubInstructions = `
CRITICAL EXCLUSIONS — never include these in any generated brief:

Studio names that must NEVER appear: ${SCRUB_LIST.studios.join(', ')}.
Real platforms that must NEVER appear: ${SCRUB_LIST.platforms.join(', ')}.
Real people who must NEVER appear: ${SCRUB_LIST.realPeople.join(', ')}.
Real brands that must NEVER appear: ${SCRUB_LIST.realBrands.join(', ')}.
Real compositions that must NEVER appear: ${SCRUB_LIST.realCompositions.join(', ')}.

${SCRUB_LIST.studioTaglineRule}
${SCRUB_LIST.submissionRule}
`;

  return `You are a senior music supervisor at Sonant Studio writing a sync brief that will be used by a composer to practice writing music for a real-world brand.

Your output is a JSON object matching the schema provided in the user message. Every field must be populated. The JSON must be valid and parseable.

You are writing as if you were a real working music supervisor preparing a competitive brief. The brief should feel authentic, specific, and professionally written. Avoid generic or template language.

# YOUR PATTERN LIBRARY

You have access to a library of 15 patterns extracted from real industry sync briefs. Deploy 4-7 of these patterns per brief — selecting based on the category, register, and creative ambition of the brief you're writing. Combine patterns naturally; do not list them or label them in the output.

${patternDescriptions}

# CRITICAL RULES

${scrubInstructions}

# ADDITIONAL DISCIPLINE

1. Invent a fictional brand name appropriate to the category. Do NOT use real brand names. Use the category's seed list as starting inspiration but feel free to invent your own.

2. Match the brief's format and tone to the category's default register. A SPIRITS brief should read like a presentation deck. A TECH brief should read like a FLASH BRIEF. An AUTOMOTIVE brief should read like an engineered template.

3. Vary the consideration labels. Do NOT default to "Pacing / Personality / Surprise." Pick 3 labels that match what the brief is actually about (e.g., "Restraint / Texture / Identity" for a wellness brief; "Hook / Repetition / Polish" for an anthem).

4. Reference tracks should always include a delta — what's RIGHT about the reference and what should be DIFFERENT. Avoid flat "make it sound like X" directives.

5. Include 1-3 specific items in the "avoid" list. Name failure modes specifically, not generically.

6. The studio identity in fileNaming and submitUrl must be Sonant. File naming convention format: \`Sonant_[BrandName]_[ProjectName]_[ComposerInitials]_[TrackTitle]_[Date]\`. Submit URL format: \`SUBMIT VIA SONANT\` or \`s.sonant.io/submit/[brief-id]\`.

7. The greeting and story should sound like a real human wrote them — varied sentence rhythm, occasional informal language, distinct voice. Do NOT use the same opening structure every time.

8. The "ask" section should articulate the core creative challenge in 2-4 sentences. Reference the patterns you're deploying without naming them.

9. The "direction" array should contain 4-6 specific compositional directions. Each direction should be actionable and specific (timecodes, structural moves, instrumentation calls).

10. Tempo, key, length, format should be specific. Tempo should be a BPM range. Key should be musical guidance ("Modal preferred, avoid clear major resolutions"). Length should match the deliverable.

11. Commercial terms should be category-realistic. Spirits = $5-15K demo fee range. Tech prestige = $5-10K. Anthem = larger ($10-25K). Athletic = $5-12K.

Generate briefs that real composers would recognize as authentic. Avoid AI-generated-feeling text. Be specific. Trust the composer's intelligence.`;
}

function buildUserPrompt(input: GenerateBriefInput): string {
  const category = BRAND_CATEGORIES[input.category];
  if (!category) {
    throw new Error(`Unknown category: ${input.category}`);
  }

  const codename = pickCodename();
  const briefId = makeBriefId(input.mode);
  const issued = todayIso();
  const deadline = deadlineIso(14);

  return `Generate a music brief with the following parameters.

**Category:** ${category.name} (${category.tag})
**Default register:** ${category.defaultRegister}
**Primary patterns to deploy:** ${category.primaryPatterns.join(', ')}
**Failure modes specific to this category:** ${category.failureModesToAvoid.join('; ')}
**Fictional brand seed pool (invent your own or pick from these):** ${category.fictionalBrandSeeds.join(', ')}
**Register notes:** ${category.registerNotes}

**Composer's selected genre palette:** ${input.genres.join(', ')}
**Composer's selected emotional arc:** ${input.moods.join(', ')}

**Pre-generated metadata (use these exactly in the JSON):**
- codename: "${codename}"
- briefId: "${briefId}"
- issued: "${issued}"
- deadline: "${deadline}"
- mode: "brand"
- classification: "CONFIDENTIAL"

Return ONLY a valid JSON object matching this exact schema (no preamble, no markdown code blocks, no explanation):

{
  "mode": "brand",
  "codename": "${codename}",
  "briefId": "${briefId}",
  "issued": "${issued}",
  "deadline": "${deadline}",
  "client": "<fictional brand name>",
  "classification": "CONFIDENTIAL",
  "project": "<short project description>",
  "deliverable": "<deliverable spec, e.g., ':30 master + :15 cutdown'>",
  "usage": "<usage rights statement>",
  "greeting": "<warm or terse opening line — 1-3 sentences in real-supervisor voice>",
  "story": "<the spot's narrative or campaign context — 4-6 sentences>",
  "ask": "<core creative challenge — 2-4 sentences>",
  "considerations": [
    { "label": "<varied label>", "body": "<2-3 sentences>" },
    { "label": "<varied label>", "body": "<2-3 sentences>" },
    { "label": "<varied label>", "body": "<2-3 sentences>" }
  ],
  "direction": [
    "<specific direction with timecode or structural move>",
    "<specific direction>",
    "<specific direction>",
    "<specific direction>",
    "<specific direction>"
  ],
  "genrePalette": "${input.genres.join(' / ')}",
  "emotionalArc": "${input.moods.join(' → ')}",
  "references": [
    { "track": "<artist — track>", "why": "<reference + delta — 1-2 sentences>" },
    { "track": "<artist — track>", "why": "<reference + delta>" },
    { "track": "<artist — track>", "why": "<reference + delta>" },
    { "track": "<artist — track>", "why": "<reference + delta>" }
  ],
  "tempo": "<BPM range with brief context>",
  "key": "<musical guidance>",
  "length": "<length with cut points>",
  "format": "<technical format spec>",
  "fileNaming": "Sonant_<BrandSlug>_YourInitials_TrackTitle_YYYYMMDD.wav",
  "avoid": [
    "<specific failure mode>",
    "<specific failure mode>",
    "<specific failure mode>"
  ],
  "deliverables": [
    "<deliverable item>",
    "<deliverable item>",
    "<deliverable item>",
    "<deliverable item>"
  ],
  "terms": {
    "fee": "<demo or composition fee, category-realistic>",
    "backend": "<royalty/publishing arrangement>",
    "exclusivity": "<exclusivity terms>"
  },
  "submitUrl": "s.sonant.io/submit/${briefId.toLowerCase()}"
}

Begin output with the opening { brace and end with the closing } brace. No other text.`;
}

// ============================================================
// THE SERVER ACTION
// ============================================================

export async function generateBrief(input: GenerateBriefInput): Promise<{ brief?: Brief; error?: string }> {
  if (input.mode !== 'brand') {
    return {
      error: 'Film and Games briefs are coming soon. Brand briefs are available now.',
    };
  }

  if (!BRAND_CATEGORIES[input.category]) {
    return {
      error: `Unknown category: ${input.category}`,
    };
  }

  if (input.genres.length === 0 || input.moods.length === 0) {
    return {
      error: 'Please select at least one genre and one mood.',
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in environment variables.');
    return {
      error: 'Brief generation is temporarily unavailable. Please try again later.',
    };
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(input),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { error: 'Unexpected response format from generator. Please try again.' };
    }

    let raw = textBlock.text.trim();
    if (raw.startsWith('```json')) {
      raw = raw.slice(7);
    } else if (raw.startsWith('```')) {
      raw = raw.slice(3);
    }
    if (raw.endsWith('```')) {
      raw = raw.slice(0, -3);
    }
    raw = raw.trim();

    let parsed: Brief;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error('Failed to parse generator JSON:', parseError);
      console.error('Raw output:', raw);
      return { error: 'Generator returned invalid format. Please try again.' };
    }

    return { brief: parsed };
  } catch (apiError) {
    console.error('Anthropic API error:', apiError);
    const message = apiError instanceof Error ? apiError.message : 'Unknown error';

    if (message.includes('rate_limit')) {
      return { error: 'Rate limit reached. Please try again in a minute.' };
    }
    if (message.includes('insufficient_credit') || message.includes('credit_balance')) {
      return { error: 'Generation service temporarily unavailable. Please try again later.' };
    }
    return { error: 'Brief generation failed. Please try again.' };
  }
}