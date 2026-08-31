'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  BRAND_CATEGORIES,
  FILM_CATEGORIES,
  GAMES_CATEGORIES,
  SCRUB_LIST,
  getActivePatterns,
  type CategoryMeta,
} from '@/lib/brief-patterns';
import {
  formatGroundedTrack,
  groundReferenceCandidates,
  type GroundedTrack,
  type ReferenceCandidate,
} from '@/lib/music-lookup';

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
  url?: string;
}

export interface Brief {
  mode: 'brand' | 'film' | 'games';
  codename: string;
  briefId: string;
  issued: string;
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

function lengthForMode(mode: 'brand' | 'film' | 'games'): string {
  if (mode === 'film') return '60-120 seconds';
  if (mode === 'games') return '30-60 seconds (loopable)';
  return '15-30 seconds';
}

// ============================================================
// IDENTITY SEEDS — force variance in client/scene layer
// ============================================================

const BRAND_SEEDS = {
  vertical: [
    'outdoor & adventure gear', 'B2B SaaS', 'plant-based food', 'fintech & payments',
    'direct-to-consumer skincare', 'electric mobility', 'craft spirits', 'sustainable fashion',
    'wellness & fitness apps', 'home goods & interiors', 'pet care', 'travel & hospitality',
    'children\'s education', 'luxury real estate', 'functional beverages', 'independent bookshops',
  ],
  campaign: [
    'product launch', 'brand anthem', 'seasonal campaign', 'social impact story',
    'founder origin story', 'customer testimonial spot', 'irreverent humor campaign',
    'heritage & legacy relaunch', 'challenger brand positioning', 'community-first campaign',
    'global expansion launch', 'limited edition drop',
  ],
  scale: [
    'bootstrapped startup finding its voice', 'venture-backed scale-up going mainstream',
    'heritage brand repositioning for a new generation', 'global CPG with regional focus',
    'niche specialist crossing into mass market', 'challenger brand taking on a category leader',
    'values-led cooperative', 'celebrity-founded direct-to-consumer brand',
  ],
};

const FILM_SEEDS = {
  context: [
    'Sundance-track indie feature', 'prestige streaming limited series', 'festival short film',
    'prestige drama theatrical release', 'slow-burn psychological thriller', 'documentary feature',
    'debut feature from an emerging director', 'art house co-production',
    'adapted literary novel', 'social realist drama',
  ],
  visual: [
    'handheld verité with natural light', 'wide anamorphic cinematography', 'intimate close-up driven',
    'archival footage mixed with present-day', 'sparse long unbroken takes', 'dense kinetic editing',
    'static locked-off frames', 'shallow depth of field throughout',
  ],
  register: [
    'quiet and deeply interior', 'slow-burn tension that never fully releases', 'social realism with no score relief',
    'dreamlike and temporally fractured', 'restrained character study', 'genre film with arthouse ambition',
    'unsentimental emotional restraint', 'elliptical non-linear storytelling',
  ],
};

const GAMES_SEEDS = {
  genre: [
    'action-RPG', 'survival horror', 'narrative adventure', 'open-world exploration',
    'roguelike dungeon crawler', 'puzzle-platformer', 'atmospheric horror', 'tactical RPG',
    'city builder', 'metroidvania', 'cozy life sim', 'souls-like',
  ],
  art: [
    'stylized 3D', 'pixel art with modern lighting', 'hand-drawn painterly', 'photorealistic',
    'low-poly minimalist', 'retro-CRT inspired', 'watercolor and ink', 'voxel-based',
  ],
  moment: [
    'the opening minutes before the player knows the rules', 'mid-game turning point where stakes shift',
    'final confrontation before the credits', 'ambient open-world exploration loop',
    'narrative cutscene revealing a key truth', 'post-death respawn screen',
    'quiet downtime between missions', 'title screen and main menu',
    'tutorial section before the first threat', 'victory and resolution sequence',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const OVERUSED_REFERENCE_ARTISTS = [
  'Nico Muhly', 'Jonny Greenwood', 'Jóhann Jóhannsson', 'Johann Johannsson',
  'Ryuichi Sakamoto', 'Ennio Morricone', 'Bernard Herrmann', 'Hans Zimmer',
  'Max Richter', 'Ólafur Arnalds', 'Olafur Arnalds', 'Ludovico Einaudi',
  'Disasterpeace', 'Darren Korb', 'Austin Wintory', 'Jesper Kyd', 'Yoko Shimomura',
];

const REFERENCE_LANES = {
  brand: [
    'a specific UK electronic, breakbeat, or trip-hop record you can name by title',
    'a US indie or alternative band track, not a film composer',
    'a soul, R&B, or hip-hop production record with a named beat or sample treatment',
    'a singer-songwriter or folk record that is mostly acoustic',
    'a jazz, library, or production-music cue with a real catalog title',
    'a Latin, African, or other regional record you actually know',
    'a Scandinavian or European pop/electronic single, not a film score',
    'an ambient or experimental record with a sparse, named arrangement',
    'a vintage 60s-80s pop, funk, or soundtrack-adjacent single',
    'a contemporary bedroom-pop or DIY electronic track',
  ],
  film: [
    'a chamber or solo cue (piano, guitar, voice, or a small ensemble only)',
    'a 1960s-80s analog score cue that is not Morricone or Herrmann',
    'a contemporary indie or pop record used as a picture reference, not a film composer',
    'a jazz, source, or diegetic-feeling cue',
    'an electronic or hybrid cue from a composer outside the usual prestige list',
    'a folk, country, or guitar-led cue',
    'a choral or vocal-led piece that is actually sung, not orchestral',
    'a percussion-forward or rhythm-section cue with almost no melody pad',
    'a small-ensemble modern-classical piece that is not Nico Muhly or Greenwood',
    'a documentary or verité-adjacent cue that stays close-miked and dry',
  ],
  games: [
    'a chiptune, FM, or limited-hardware cue you can name',
    'an acoustic, folk, or chamber game cue, not a full orchestra',
    'an industrial, horror, or drone cue',
    'a jazz, lounge, or diegetic in-world source track',
    'a synthwave or analog-synth cue',
    'a rock or band-arrangement game track',
    'a vocal-led or choral game cue',
    'an adaptive ambient underscore that stays sparse',
    'a world, folk, or regional record used as a game reference',
    'a puzzle or cozy-game cue that is small and loop-minded',
  ],
} as const;

function pickTwo<T>(arr: readonly T[]): [T, T] {
  const first = pick([...arr]);
  const rest = arr.filter((item) => item !== first);
  return [first, pick([...rest])];
}

function referenceArtist(track: string): string {
  return track.split(',')[0]?.trim() ?? '';
}

function pickReferenceLanes(mode: 'brand' | 'film' | 'games'): [string, string] {
  return pickTwo(REFERENCE_LANES[mode]);
}

function pickReferenceSteer(lanes: [string, string], locked: GroundedTrack[]): string {
  if (locked.length > 0) {
    const facts = locked.map((track, index) => `Reference ${index + 1}\n${formatGroundedTrack(track)}`).join('\n\n');
    const remaining =
      locked.length < 2
        ? `\n\nReference 2 is not locked. Pick a real recording from this lane, different artist: ${lanes[1]}.`
        : '';
    return [
      '**LOCKED REFERENCES — use these exact tracks. Do not substitute.**',
      'Write "like" and "avoid" from the facts below only. If credits or notes do not mention an instrument, section, or build, it is not on the record.',
      '',
      facts,
      remaining,
    ].join('\n');
  }
  return [
    '**Reference lanes — one track from each. Both must be real released recordings you can recall in detail:**',
    `- Reference 1: ${lanes[0]}`,
    `- Reference 2: ${lanes[1]}`,
    '- Different artists. Prefer different decades or scenes.',
    `- Do not reach for these default names unless nothing else fits: ${OVERUSED_REFERENCE_ARTISTS.slice(0, 12).join(', ')}.`,
  ].join('\n');
}

async function proposeReferenceCandidates(
  client: Anthropic,
  input: GenerateBriefInput,
  lanes: [string, string],
  avoidArtists: string[]
): Promise<ReferenceCandidate[]> {
  const avoid = [...new Set([...OVERUSED_REFERENCE_ARTISTS, ...avoidArtists])].slice(0, 24).join('; ');
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `Propose 6 real released recordings a music supervisor might cite. Return ONLY JSON.

Mode: ${input.mode}
Genres: ${input.genres.join(', ')}
Moods: ${input.moods.join(', ')}
Lane 1: ${lanes[0]}
Lane 2: ${lanes[1]}
Do not use these artists: ${avoid}

Rules:
- 3 candidates for lane 1, 3 for lane 2
- Real artist + real track title, no invented songs
- Different artists across all 6
- Prefer specific album tracks over "greatest hits" vagueness

{"candidates":[{"artist":"","title":"","lane":1},{"artist":"","title":"","lane":1},{"artist":"","title":"","lane":1},{"artist":"","title":"","lane":2},{"artist":"","title":"","lane":2},{"artist":"","title":"","lane":2}]}`,
      },
    ],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];
  try {
    const parsed = JSON.parse(extractJsonObject(textBlock.text)) as {
      candidates?: { artist?: string; title?: string }[];
    };
    return (parsed.candidates ?? [])
      .map((row) => ({ artist: row.artist?.trim() ?? '', title: row.title?.trim() ?? '' }))
      .filter((row) => row.artist && row.title);
  } catch {
    return [];
  }
}

function applyLockedReferences(brief: Brief, locked: GroundedTrack[]): Brief {
  if (locked.length === 0) return brief;
  return {
    ...brief,
    references: brief.references.map((ref, index) => {
      const track = locked[index];
      if (!track) return ref;
      return {
        ...ref,
        track: `${track.artist}, ${track.title}`,
        url: track.listenUrl ?? ref.url,
      };
    }),
  };
}

async function getRecentReferenceTracks(
  mode: 'brand' | 'film' | 'games'
): Promise<{ block: string; artists: string[] }> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('briefs')
      .select('mode, generated_content')
      .order('created_at', { ascending: false })
      .limit(80);

    if (!data || data.length === 0) return { block: '', artists: [] };

    const artists = new Set<string>();
    const tracks = new Set<string>();
    for (const row of data) {
      const content = row.generated_content as { mode?: string; references?: { track?: string }[] } | null;
      const rowMode = (row as { mode?: string }).mode ?? content?.mode;
      if (rowMode && rowMode !== mode) continue;
      for (const ref of content?.references ?? []) {
        const track = typeof ref.track === 'string' ? ref.track.trim() : '';
        if (!track) continue;
        tracks.add(track);
        const artist = referenceArtist(track);
        if (artist) artists.add(artist);
        if (artists.size >= 18) break;
      }
      if (artists.size >= 18) break;
    }

    const artistList = [...artists].slice(0, 18);
    if (artistList.length === 0) return { block: '', artists: [] };
    return {
      artists: artistList,
      block: [
        '**Do not reuse these recently cited artists or tracks. Pick elsewhere.**',
        `- Artists: ${artistList.join('; ')}`,
        tracks.size > 0 ? `- Tracks: ${[...tracks].slice(0, 12).join('; ')}` : '',
      ].filter(Boolean).join('\n'),
    };
  } catch {
    return { block: '', artists: [] };
  }
}

function pickIdentitySeed(mode: 'brand' | 'film' | 'games'): string {
  if (mode === 'brand') {
    return [
      '**Creative Seed — use this to shape the client identity and campaign angle. Do not echo these words verbatim; translate them into a specific fictional brand and project:**',
      `- Industry: ${pick(BRAND_SEEDS.vertical)}`,
      `- Campaign type: ${pick(BRAND_SEEDS.campaign)}`,
      `- Company profile: ${pick(BRAND_SEEDS.scale)}`,
    ].join('\n');
  }
  if (mode === 'film') {
    return [
      '**Creative Seed — use this to shape the production context and visual register. Do not echo these words verbatim; translate them into a specific fictional project and scene:**',
      `- Production context: ${pick(FILM_SEEDS.context)}`,
      `- Visual language: ${pick(FILM_SEEDS.visual)}`,
      `- Narrative register: ${pick(FILM_SEEDS.register)}`,
    ].join('\n');
  }
  return [
    '**Creative Seed — use this to shape the game world and in-game moment. Do not echo these words verbatim; translate them into a specific fictional game and context:**',
    `- Game genre: ${pick(GAMES_SEEDS.genre)}`,
    `- Art direction: ${pick(GAMES_SEEDS.art)}`,
    `- In-game moment: ${pick(GAMES_SEEDS.moment)}`,
  ].join('\n');
}

// ============================================================
// FEW-SHOT CORPUS — inject approved real-world examples
// ============================================================

async function getFewShotExamples(mode: 'brand' | 'film' | 'games'): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('brief_corpus')
      .select('extracted_fields')
      .eq('approved', true)
      .eq('mode', mode)
      .gte('quality_score', 3)
      .limit(4);

    if (!data || data.length === 0) return '';

    const examples = data
      .map((row, i) => {
        const f = row.extracted_fields as Record<string, string | null> | null;
        if (!f) return null;
        const parts = [
          f.scene_context && `Scene: ${f.scene_context}`,
          f.music_ask && `Music ask: ${f.music_ask}`,
          f.instrumentation_notes && `Instrumentation notes: ${f.instrumentation_notes}`,
        ].filter(Boolean).join('\n');
        return parts ? `Example ${i + 1}:\n${parts}` : null;
      })
      .filter(Boolean)
      .join('\n\n');

    if (!examples) return '';

    return `\n\n# REFERENCE BRIEF LANGUAGE\nThese are excerpts from real-world briefs. Study the vocabulary, specificity, and register — write at this level of concreteness.\n\n${examples}`;
  } catch {
    return '';
  }
}

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildSystemPrompt(mode: 'brand' | 'film' | 'games', fewShotBlock = ''): string {
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

6. "references" is exactly 2 entries. "track" format: "Artist Name, Track Title" (comma separator). When LOCKED REFERENCES are provided, copy those titles exactly and write "like" and "avoid" from the supplied credits, tags, and public notes only. Never add an instrument, section, choir, or build that is not in those facts. When references are not locked, cite only real released recordings you can actually recall. If you cannot remember how THAT specific track is arranged, pick a different track you do know. The two references must be different artists. One sentence each. No em dashes.

7. No em dashes anywhere in the brief. Use commas, periods, or parentheses instead.

8. Write "tempo" as a BPM range with a plain hyphen: "95-115 BPM". No en dash.

9. Be concise. One clear idea per sentence. Avoid over-explaining.

10. Every choice must fit the established genre and mood. Coherence over novelty.
${modeRule}

${scrubInstructions}${fewShotBlock}`;
}

function buildUserPrompt(
  input: GenerateBriefInput,
  referenceBlock = '',
  lanes: [string, string] = pickReferenceLanes(input.mode),
  locked: GroundedTrack[] = []
): string {
  const categories = getCategoriesForMode(input.mode);
  const category = categories[input.category];
  if (!category) throw new Error(`Unknown category: ${input.category}`);

  const briefId = makeBriefId();
  const issued = todayFormatted();
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

  const identitySeed = pickIdentitySeed(input.mode);

  return `Generate a music brief with the following parameters.

${categoryBlock}

${identitySeed}

**Genre Palette:** ${input.genres.join(', ')}
**Emotional Arc:** ${input.moods.join(', ')}
**Track Type:** ${vocals}

${codenameInstruction}

${pickReferenceSteer(lanes, locked)}
${referenceBlock ? `\n${referenceBlock}\n` : ''}
**Pre-generated metadata — use these values exactly:**
- mode: "${input.mode}"
- briefId: "${briefId}"
- issued: "${issued}"
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
      "track": "${locked[0] ? `${locked[0].artist}, ${locked[0].title}` : '<Artist Name, Track Title — a real recording from reference lane 1>'}",
      "like": "<what to borrow from THIS recording, using only the supplied facts or the actual arrangement>",
      "avoid": "<what not to copy from THIS recording, and only things that are actually on it>"
    },
    {
      "track": "${locked[1] ? `${locked[1].artist}, ${locked[1].title}` : '<Artist Name, Track Title — a real recording from reference lane 2, different artist>'}",
      "like": "<what to borrow from THIS recording, using only the supplied facts or the actual arrangement>",
      "avoid": "<what not to copy from THIS recording, and only things that are actually on it>"
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
      url: r.url,
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
    'mode', 'codename', 'briefId', 'issued', 'client',
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
    const artists = (b.references as { track?: string }[])
      .map((r) => referenceArtist(r.track ?? '').toLowerCase())
      .filter(Boolean);
    if (new Set(artists).size < 2) {
      problems.push('References must be two different artists.');
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
  const [fewShotBlock, recentRefs] = await Promise.all([
    getFewShotExamples(input.mode),
    getRecentReferenceTracks(input.mode),
  ]);
  const lanes = pickReferenceLanes(input.mode);

  let locked: GroundedTrack[] = [];
  try {
    const candidates = await proposeReferenceCandidates(client, input, lanes, recentRefs.artists);
    locked = await groundReferenceCandidates(candidates, recentRefs.artists, 2);
    if (locked.length < 2) {
      console.warn(`Grounded ${locked.length} of 2 reference tracks; generating with what we have.`);
    }
  } catch (lookupError) {
    console.error('Reference lookup failed; falling back to prompt-only references.', lookupError);
  }

  const systemPrompt = buildSystemPrompt(input.mode, fewShotBlock);
  const baseUserPrompt = buildUserPrompt(input, recentRefs.block, lanes, locked);

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

    return { brief: applyLockedReferences(scrubBrief(parsed as Brief), locked) };
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
