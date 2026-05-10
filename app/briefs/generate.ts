// app/briefs/generate.ts
//
// Server action that generates a Sonant brief using the Anthropic API.
// Consumes the pattern library + brief types from lib/brief-patterns.ts
// and returns a fully-shaped Brief object that matches the BriefDocument
// interface.
//
// This file runs server-side only. The Anthropic API key is never
// exposed to the browser.

'use server';

import Anthropic from '@anthropic-ai/sdk';
import {
  BRAND_CATEGORIES,
  BRIEF_TYPES,
  BriefTypeId,
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
// INPUT
// ============================================================

export interface GenerateBriefInput {
  category: string;          // e.g., "Sports", "Automotive"
  genres: string[];          // user-selected, 1-3 items
  moods: string[];           // user-selected, 1-3 items
  briefType: BriefTypeId;    // 'flash' | 'standard' | 'anthem'
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

function makeBriefId(): string {
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `BR-2026-${num}`;
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
- Key sub-patterns: ${p.subPatterns.slice(0, 4).join('; ')}
- Anti-patterns to avoid: ${p.antiPatterns.slice(0, 2).join('; ')}
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

  return `You are a senior music supervisor at Sonant Studio writing a sync brief that will be used by a composer to practice writing music.

Your output is a JSON object matching the schema provided in the user message. Every field must be populated. The JSON must be valid and parseable.

You write as if you were a real working music supervisor preparing a competitive brief. The brief should feel authentic, specific, and professionally written. Avoid generic, overwritten, or template language.

# YOUR PATTERN LIBRARY

You have access to a library of 15 patterns extracted from real industry sync briefs. Deploy 3-6 of these patterns per brief — selecting based on the category, brief type, and creative ambition. Combine patterns naturally; do not list them or label them in the output.

${patternDescriptions}

# CRITICAL RULES

${scrubInstructions}

# DISCIPLINE

1. Invent a fictional brand name appropriate to the category. Do NOT use real brand names. Use the category's seed list as starting inspiration but feel free to invent your own.

2. Match the brief's format and tone to the brief type AND the category's default register. A Flash brief should be terse and compressed. A Standard brief should be structured but not overwritten. An Anthem brief should be expansive and reflect multi-use-case scope.

3. Vary the consideration labels per brief. Pick labels that match what the brief is actually about (e.g., "Restraint / Texture / Identity" for a wellness brief; "Hook / Polish / Reuse" for an anthem). Do NOT default to "Pacing / Personality / Surprise."

4. Reference tracks must always include a delta — what's RIGHT about the reference and what should be DIFFERENT. Avoid flat "make it sound like X" directives.

5. Include 1-3 specific items in the "avoid" list. Name failure modes specifically, not generically.

6. The studio identity in fileNaming and submitUrl is Sonant. File naming convention format: \`Sonant_[BrandSlug]_YourInitials_TrackTitle_YYYYMMDD.wav\`. Submit URL format: \`s.sonant.io/submit/[brief-id-lowercase]\`.

7. The greeting and story should sound like a real human wrote them — varied sentence rhythm, occasional informal language, distinct voice. Do NOT use the same opening structure every time.

8. The "ask" section articulates the core creative challenge. Length depends on brief type: Flash = 1 sentence; Standard = 2-3 sentences; Anthem = 3-4 sentences.

9. Tempo, key, length, format are specific. Tempo is a BPM range. Key is musical guidance ("Modal preferred, avoid clear major resolutions"). Length matches the deliverable.

10. Commercial terms are category-realistic. Sports = $5-12K demo fee. Tech = $5-10K. Anthem = $10-25K. Healthcare = $5-15K. Financial = $8-18K. Beverage = $5-15K. Fashion = $5-15K. Food = $5-12K. Lifestyle = $4-10K.

11. Be CONCISE. Real briefs are tight. Avoid filler. Every sentence should carry information. Avoid the AI tendency to over-explain.

Generate briefs that real composers would recognize as authentic. Avoid AI-generated-feeling text. Be specific. Trust the composer's intelligence.`;
}

function buildUserPrompt(input: GenerateBriefInput): string {
  const category = BRAND_CATEGORIES[input.category];
  if (!category) {
    throw new Error(`Unknown category: ${input.category}`);
  }

  const briefType = BRIEF_TYPES[input.briefType];
  if (!briefType) {
    throw new Error(`Unknown brief type: ${input.briefType}`);
  }

  const codename = pickCodename();
  const briefId = makeBriefId();
  const issued = todayIso();
  const deadlineDays = input.briefType === 'flash' ? 3 : input.briefType === 'anthem' ? 10 : 5;
  const deadline = deadlineIso(deadlineDays);

  return `Generate a music brief with the following parameters.

**Brief Type:** ${briefType.label}
**Brief Type Notes:** ${briefType.registerNotes}
**Target Word Count:** ${briefType.targetWordCount}
**Structural Counts:** ${briefType.considerationCount} consideration(s), ${briefType.directionCount} direction(s), ${briefType.referenceCount} reference(s)

**Category:** ${category.name}
**Default Register:** ${category.defaultRegister}
**Primary Patterns to Deploy:** ${category.primaryPatterns.join(', ')}
**Failure Modes Specific to This Category:** ${category.failureModesToAvoid.join('; ')}
**Fictional Brand Seed Pool (invent your own or pick from these):** ${category.fictionalBrandSeeds.join(', ')}
**Register Notes:** ${category.registerNotes}

**Composer's Selected Genre Palette:** ${input.genres.join(', ')}
**Composer's Selected Emotional Arc:** ${input.moods.join(', ')}

**Pre-generated Metadata (use these exactly in the JSON):**
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
  "greeting": "<warm or terse opening — match the brief type's register>",
  "story": "<the spot's narrative or campaign context — length depends on brief type>",
  "ask": "<core creative challenge — length depends on brief type>",
  "considerations": [
    ${'{ "label": "<varied label>", "body": "<concise body>" },'.repeat(briefType.considerationCount).slice(0, -1)}
  ],
  "direction": [
    ${'"<specific actionable direction>",'.repeat(briefType.directionCount).slice(0, -1)}
  ],
  "genrePalette": "${input.genres.join(' / ')}",
  "emotionalArc": "${input.moods.join(' → ')}",
  "references": [
    ${'{ "track": "<artist — track>", "why": "<reference + delta>" },'.repeat(briefType.referenceCount).slice(0, -1)}
  ],
  "tempo": "<BPM range>",
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
    "fee": "<demo or composition fee, category- and type-realistic>",
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

export async function generateBrief(
  input: GenerateBriefInput
): Promise<{ brief?: Brief; error?: string }> {
  if (!BRAND_CATEGORIES[input.category]) {
    return {
      error: `Unknown category: ${input.category}`,
    };
  }

  if (!BRIEF_TYPES[input.briefType]) {
    return {
      error: `Unknown brief type: ${input.briefType}`,
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
  const briefType = BRIEF_TYPES[input.briefType];
  const maxTokens = input.briefType === 'flash' ? 2000 : input.briefType === 'anthem' ? 5000 : 3000;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
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

    // Mark unused for ESLint while keeping intent clear
    void briefType;

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