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
  vocals: string;
  tempo: string;
  key: string;
  length: string;
  format: string;
  fileNaming: string;
  avoid: string[];
  deliverables: string[];
  terms: {
    fee: string;
    usageType: string;
    duration: string;
    exclusivity: string;
    backend?: string; // legacy field kept for old saved briefs
  };
}

// ============================================================
// INPUT
// ============================================================
// ============================================================
// DISCO TAXONOMY — preferred vocabulary for generated briefs.
// These mirror the tag system in the Disco catalog so that brief
// language aligns with how accepted tracks get tagged. The model
// draws from this vocabulary; it does not pick tags at random.
// Common, broadly-applicable terms are listed first in each list.
// ============================================================

const DISCO_TAXONOMY = {
  // Listed common-first. Niche vocal types come last and should
  // only be used when the genre and concept genuinely call for them.
  vocals: [
    'Female vocal', 'Male vocal', 'Background vocals', 'Harmonies',
    'Oohs', 'Aahs', 'Choir', 'Clean', 'Duet', 'A cappella',
    'Whispering', 'Whistling', 'Scat', 'Explicit', 'Foreign language',
    'Spanish language', 'French language', 'German language',
    'Splice Vox',
  ],
  tempo: ['Downtempo', 'Slow', 'Midtempo', 'Uptempo', 'Fast'],
  // Common-first. Trailing entries are specialized.
  lyricThemes: [
    'Love', 'Hope', 'Freedom', 'Confidence', 'Connection', 'Family',
    'Friendship', 'Celebration', 'Empowerment', 'Strength', 'Success',
    'Adventure', 'Change', 'Discovery', 'Dream', 'Energy', 'Escape',
    'Gratitude', 'Happiness', 'Home', 'Identity', 'Individuality',
    'Life', 'Nature', 'New beginning', 'Nostalgia', 'Time', 'Together',
    'Unity', 'Ambition', 'Desire', 'Destiny', 'Faith', 'Longing',
    'Party', 'Power', 'Relationship', 'Romance', 'Survival',
    'Heartbreak', 'Breakup', 'Loneliness', 'Loss', 'Pain', 'Regret',
    'Struggle', 'Conflict', 'Fear', 'Betrayal', 'Death', 'Rebellion',
    'Money', 'Narrative', 'Christmas', 'Fun', 'Happiness',
  ],
  // Type tags describe what kind of deliverable the track is.
  type: [
    'Mainstream', 'Focus track', 'Demo', 'Soundtrack', 'Score',
    'Jingle', 'Sound design', 'Sting', 'Cover', 'Remix', 'Rerecord',
    'One stop', 'Easy-clear', 'Recognizable', 'Samples', 'Trailerized',
    'Suno',
  ],
} as const;
export interface GenerateBriefInput {
  category: string;          // e.g., "Sports", "Automotive"
  genres: string[];          // user-selected, 1-3 items
  moods: string[];           // user-selected, 1-3 items
  briefType: BriefTypeId;    // 'flash' | 'standard' | 'anthem'
  withVocals: boolean;       // true = brief calls for vocals, false = instrumental
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

1. Invent a fictional brand name appropriate to the category. Do NOT use real brand names. The seed list is for inspiration only — treat each brief as a fresh invention and actively avoid defaulting to the same names. Vary the register: not every sports brand is heavy/industrial, not every tech brand is sleek/minimal. Draw from the full range of the seed pool and invent beyond it freely.

2. Match the brief's format and tone to the brief type AND the category's default register. A Flash brief should be terse and compressed. A Standard brief should be structured but not overwritten. An Anthem brief should be expansive and reflect multi-use-case scope.

3. Vary the consideration labels per brief. Pick labels that match what the brief is actually about (e.g., "Restraint / Texture / Identity" for a wellness brief; "Hook / Polish / Reuse" for an anthem). Do NOT default to "Pacing / Personality / Surprise."

4. Reference tracks must always include a delta — what's RIGHT about the reference and what should be DIFFERENT. Avoid flat "make it sound like X" directives.

5. Include 1-3 specific items in the "avoid" list. Name failure modes specifically, not generically. For Tier C briefs, output an empty avoid array — keeping the brief lean and approachable is more important than listing failure modes at this level.

6. The studio identity in fileNaming is Sonant. File naming convention format: \`Sonant_[BrandSlug]_YourInitials_TrackTitle_YYYYMMDD.wav\`.

7. The greeting and story should sound like a real human wrote them — varied sentence rhythm, occasional informal language, distinct voice. Do NOT use the same opening structure every time.

8. The "ask" section articulates the core creative challenge. Length depends on brief type: Flash = 1 sentence; Standard = 2-3 sentences; Anthem = 3-4 sentences.

9. Tempo, key, length, format are specific. Tempo must be written as a BPM range using an en dash — e.g. "115–125 BPM" or "Uptempo, 115–125 BPM". Never list two separate BPM numbers without a dash between them. Key is musical guidance ("Modal preferred, avoid clear major resolutions"). Length matches the deliverable.

10. Commercial terms must be written in plain language that a composer at any level can understand without Googling. No industry shorthand without explanation. Category fee ranges: Sports = $5-12K, Tech = $5-10K, Anthem = $10-25K, Healthcare = $5-15K, Financial = $8-18K, Beverage = $5-15K, Fashion = $5-15K, Food = $5-12K, Lifestyle = $4-10K. For each field: "fee" = state the exact dollar amount offered and precisely what it covers (e.g., "$7,500 flat composition fee for the demo. If the track is selected for the campaign, a separate licensing fee is negotiated at time of placement."). "usageType" = state exactly where and how the music will be used, in plain terms (e.g., "National broadcast television and paid digital pre-roll. No radio, no out-of-home, no retail."). "duration" = state how long the license lasts (e.g., "18 months from the first air date, with an optional 12-month renewal at the client's discretion." or "In perpetuity for the specific campaign assets listed above."). "exclusivity" = state clearly yes or no, and what it means for the composer (e.g., "Non-exclusive. You can pitch this track to other supervisors and libraries. We will not pitch it to direct competitors in the same product category for 90 days." or "Exclusive for 6 months from first air date, then non-exclusive. Exclusivity applies to this campaign only.").

11. Be CONCISE. Real briefs are tight. Avoid filler. Every sentence should carry information. Avoid the AI tendency to over-explain.

12. COHERENCE OVER VARIETY. Every musical choice (vocal type, lyric theme, tempo, track type) must fit the established genre and emotional arc. A calm ambient brief does not ask for aggressive scat vocals. An upbeat pop brief does not ask for a funeral lyric theme. When choosing from any vocabulary, favor the common, fitting option over the unusual one. The brief must read as one coherent creative world.

13. PUNCTUATION. Never use em dashes or en dashes anywhere in the brief. Use commas, periods, or parentheses instead. This is a strict house style rule with no exceptions.
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

  
  const briefId = makeBriefId();
  const issued = todayIso();
  const deadlineDays = input.briefType === 'flash' ? 3 : input.briefType === 'anthem' ? 10 : 5;
  const deadline = deadlineIso(deadlineDays);

  return `Generate a music brief with the following parameters.

**Campaign Tier:** ${input.briefType === 'flash' ? 'Tier C — Local / Organic Social' : input.briefType === 'anthem' ? 'Tier A — National / Enterprise' : 'Tier B — Regional / Mid-Market'}
**Tier Density Rule:** ${
  input.briefType === 'flash'
    ? 'HARD LIMIT: under 250 words total. No dense brand history or backstory. Skip long narrative paragraphs entirely. Focus purely on: sonic vibe (1-2 punchy sentences), 1-2 reference tracks with deltas, and basic usage terms. Every sentence must be immediately clear and actionable. A beginner composer should find this brief approachable, not overwhelming. If in doubt, cut it.'
    : input.briefType === 'anthem'
    ? 'Target 700-900 words. Full enterprise-level detail required: include a visual storyboard description, target audience psychographics, strict industry-category exclusivity clauses, complex renewal and licensing terms, and multiple delivery asset specifications (stems, formats, cutdowns). This must feel like a real brief from a national advertiser — dense, specific, and professionally demanding.'
    : 'Target 350-450 words. Include a short campaign narrative (2-3 sentences), clear target demographics (1 sentence), and a concise delivery stems list. Category exclusivity introduced. Professional sync tone — detailed enough to be instructive, lean enough to remain readable. No enterprise complexity — accessible to a working composer at any level.'
}
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
**Vocal Requirement:** ${input.withVocals ? 'WITH VOCALS — this brief calls for a vocal track.' : 'INSTRUMENTAL — this brief calls for an instrumental track, no vocals.'}

**Vocal & Vocabulary Instruction:**
${input.withVocals
  ? `This is a VOCAL brief. The "vocals" field must give real, usable vocal direction: name a vocal type and give lyrical direction (a theme and a sense of approach, NOT fully written lyrics). Choose a vocal type that FITS the genre palette and emotional arc above — it must be coherent with them, never an arbitrary pick. Favor common, broadly castable vocal types: ${DISCO_TAXONOMY.vocals.slice(0, 7).join(', ')}. Only reach for specialized types (${DISCO_TAXONOMY.vocals.slice(13).join(', ')}) when the genre and concept genuinely call for it. For lyrical direction, draw a theme from this vocabulary where one fits naturally: ${DISCO_TAXONOMY.lyricThemes.slice(0, 24).join(', ')}. The lyric theme must also fit the brief's story and emotional arc. The "ask" and "direction" fields should reference the vocal performance as part of the creative challenge.`
  : `This is an INSTRUMENTAL brief. The "vocals" field must state that the track is instrumental (no lead vocals). Non-lyrical vocal textures (oohs, aahs, choir pads) are acceptable to mention ONLY if they suit the genre and mood — otherwise keep it cleanly instrumental. Do not invent a lyric theme or a singing performance.`}

When writing "tempo", you may use Disco-aligned tempo language (${DISCO_TAXONOMY.tempo.join(', ')}) alongside the BPM range. When the brief implies a track "type", lean on common type vocabulary (${DISCO_TAXONOMY.type.slice(0, 8).join(', ')}) and reserve niche types for when they truly fit. In all cases, every choice must be coherent with the established genre and mood — never pick a tag because it exists; pick it because it fits.

**Codename:** Invent a fresh project codename for this brief. One or two words. It should evoke the selected genre palette and emotional arc, not the brand category. Examples of the right feel: "Nightshift", "Paper Lanterns", "Cold Open", "Slow Tide", "Afterglow", "Ironwood". Avoid real trademarks, and do not reuse the brand name. Make it specific to the mood of this particular brief, and favor variety so generated briefs rarely repeat the same codename.

**Pre-generated Metadata (use these exactly in the JSON):**
- briefId: "${briefId}"
- issued: "${issued}"
- deadline: "${deadline}"
- mode: "brand"
- classification: "CONFIDENTIAL"

Return ONLY a valid JSON object matching this exact schema (no preamble, no markdown code blocks, no explanation):

{
  "mode": "brand",
  "codename": "<one or two word project codename, evoking the genre and mood>",
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
  "tempo": "<BPM range using en dash, e.g. 115–125 BPM or Uptempo, 115–125 BPM>",
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
    "fee": "<plain language: exact dollar amount + what it covers>",
    "usageType": "<plain language: exactly where and how the music will be used>",
    "duration": "<plain language: how long the license lasts>",
    "exclusivity": "<plain language: exclusive or non-exclusive, with a clear explanation of what that means for the composer>"
  },
  "vocals": "<vocal direction — see the vocal instruction above>"
}

Begin output with the opening { brace and end with the closing } brace. No other text.`;
}
// ============================================================
// PUNCTUATION SCRUB
// Sonant brand rule: no em dashes (they read as AI-generated).
// The model is instructed to avoid them, but this guarantees it
// by cleaning every text field of the generated brief.
// ============================================================

function scrubDashes(text: string): string {
  return text
    // Em dash with surrounding spaces -> comma + space
    .replace(/\s*—\s*/g, ', ')
    // En dash with surrounding spaces -> comma + space
    .replace(/\s*–\s*/g, ', ')
    // Any stray dash characters left -> comma
    .replace(/—|–/g, ', ')
    // Collapse any accidental double punctuation from the swap
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .trim();
}

function scrubBrief(brief: Brief): Brief {
  const s = scrubDashes;
  return {
    ...brief,
    project: s(brief.project),
    deliverable: s(brief.deliverable),
    usage: s(brief.usage),
    greeting: s(brief.greeting),
    story: s(brief.story),
    ask: s(brief.ask),
    considerations: brief.considerations.map((c) => ({
      label: s(c.label),
      body: s(c.body),
    })),
    direction: brief.direction.map(s),
    genrePalette: s(brief.genrePalette),
    emotionalArc: s(brief.emotionalArc),
    references: brief.references.map((r) => ({
      track: s(r.track),
      why: s(r.why),
    })),
    vocals: s(brief.vocals),
    tempo: s(brief.tempo),
    key: s(brief.key),
    length: s(brief.length),
    format: s(brief.format),
    avoid: brief.avoid.map(s),
    deliverables: brief.deliverables.map(s),
  };
}
// ============================================================
// JSON EXTRACTION + VALIDATION
// ============================================================

// Pulls a JSON object out of model output even if it is wrapped in
// markdown fences or has stray text before or after. Finds the first
// opening brace and the last closing brace and takes everything between.
function extractJsonObject(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text.trim();
  }
  return text.slice(firstBrace, lastBrace + 1).trim();
}

// Confirms a parsed object actually has every field the Brief
// interface requires, in the right shape. Returns a list of problems;
// an empty list means the brief is structurally complete.
function validateBrief(obj: unknown): string[] {
  const problems: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return ['Parsed value is not an object.'];
  }
  const b = obj as Record<string, unknown>;

  const requiredStrings = [
    'mode', 'codename', 'briefId', 'issued', 'deadline', 'client',
    'classification', 'project', 'deliverable', 'usage', 'greeting',
    'story', 'ask', 'genrePalette', 'emotionalArc', 'vocals', 'tempo',
    'key', 'length', 'format', 'fileNaming',
  ];
  for (const field of requiredStrings) {
    if (typeof b[field] !== 'string' || (b[field] as string).trim() === '') {
      problems.push(`Missing or empty string field: ${field}`);
    }
  }

  const requiredArrays = ['direction', 'avoid', 'deliverables'];
  for (const field of requiredArrays) {
    if (!Array.isArray(b[field]) || (b[field] as unknown[]).length === 0) {
      problems.push(`Missing or empty array field: ${field}`);
    }
  }

  if (!Array.isArray(b.considerations) || b.considerations.length === 0) {
    problems.push('Missing or empty array field: considerations');
  } else {
    for (const c of b.considerations as unknown[]) {
      const cc = c as Record<string, unknown>;
      if (typeof cc?.label !== 'string' || typeof cc?.body !== 'string') {
        problems.push('A considerations entry is missing label or body.');
        break;
      }
    }
  }

  if (!Array.isArray(b.references) || b.references.length === 0) {
    problems.push('Missing or empty array field: references');
  } else {
    for (const r of b.references as unknown[]) {
      const rr = r as Record<string, unknown>;
      if (typeof rr?.track !== 'string' || typeof rr?.why !== 'string') {
        problems.push('A references entry is missing track or why.');
        break;
      }
    }
  }

  const terms = b.terms as Record<string, unknown> | undefined;
  if (typeof terms !== 'object' || terms === null) {
    problems.push('Missing terms object.');
  } else {
    for (const field of ['fee', 'usageType', 'duration', 'exclusivity']) {
      if (typeof terms[field] !== 'string') {
        problems.push(`Missing terms.${field}`);
      }
    }
  }

  return problems;
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
  const maxTokens = input.briefType === 'flash' ? 3000 : input.briefType === 'anthem' ? 8000 : 5000;

  // Mark unused for ESLint while keeping intent clear
  void briefType;

  const systemPrompt = buildSystemPrompt();
  const baseUserPrompt = buildUserPrompt(input);

  // One generation attempt. Returns a valid Brief, or a reason string
  // describing why this attempt failed so the caller can decide to retry.
  async function attemptGeneration(
    attemptNumber: number
  ): Promise<{ brief?: Brief; failReason?: string }> {
    // On a retry, append a short corrective note to the user prompt.
    const userPrompt =
      attemptNumber === 1
        ? baseUserPrompt
        : baseUserPrompt +
          '\n\nIMPORTANT: Return ONLY the JSON object. It must be complete, ' +
          'valid, parseable JSON with every field from the schema present. ' +
          'No preamble, no markdown fences, no trailing text.';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const stopReason = response.stop_reason;

    // If the model hit the token ceiling, the JSON is truncated and
    // unparseable. Treat this as a known failure, not a mystery.
    if (stopReason === 'max_tokens') {
      const truncatedBlock = response.content.find((b) => b.type === 'text');
      const truncatedRaw = truncatedBlock?.type === 'text' ? truncatedBlock.text : '(no text block)';
      console.error(`Generator attempt ${attemptNumber} failed:`, {
        failReason: 'truncated',
        briefType: input.briefType,
        stopReason,
        rawOutput: truncatedRaw,
      });
      return { failReason: 'truncated' };
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error(`Generator attempt ${attemptNumber} failed:`, {
        failReason: 'no-text-block',
        briefType: input.briefType,
        stopReason,
        rawOutput: '(no text block)',
      });
      return { failReason: 'no-text-block' };
    }

    const raw = extractJsonObject(textBlock.text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error(`Generator attempt ${attemptNumber} failed:`, {
        failReason: 'parse-error',
        briefType: input.briefType,
        stopReason,
        rawOutput: raw,
      });
      console.error('Parse error detail:', parseError);
      return { failReason: 'parse-error' };
    }

    const problems = validateBrief(parsed);
    if (problems.length > 0) {
      console.error(`Generator attempt ${attemptNumber} failed:`, {
        failReason: 'schema-invalid',
        briefType: input.briefType,
        stopReason,
        problems,
        rawOutput: raw,
      });
      return { failReason: 'schema-invalid' };
    }

    // Sonant brand rule: strip em dashes from all brief prose.
    const cleaned = scrubBrief(parsed as Brief);
    return { brief: cleaned };
  }

  try {
    const MAX_ATTEMPTS = 2;
    let lastFailReason = 'unknown';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await attemptGeneration(attempt);
      if (result.brief) {
        if (attempt > 1) {
          console.log(`Generator succeeded on attempt ${attempt}.`);
        }
        return { brief: result.brief };
      }
      lastFailReason = result.failReason ?? 'unknown';
    }

    console.error(
      `Generator failed after ${MAX_ATTEMPTS} attempts. Last reason: ${lastFailReason}.`
    );
    return { error: 'Generator returned invalid format. Please try again.' };
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