// lib/brief-patterns.ts
//
// Pattern library for the Sonant brief generator.
// Encodes the 15 active patterns + category metadata + brief types + scrub list
// extracted from the Sonant reference doc.
//
// This file is consumed by app/briefs/generate.ts to construct
// the system prompt for the Anthropic API.

// ============================================================
// BRIEF TYPES (Flash / Standard / Anthem)
// ============================================================

export type BriefTypeId = 'flash' | 'standard' | 'anthem';

export interface BriefType {
  id: BriefTypeId;
  label: string;
  description: string;
  targetWordCount: string;
  defaultRegister: BriefRegister;
  registerNotes: string;
  considerationCount: number;
  directionCount: number;
  referenceCount: number;
}

export const BRIEF_TYPES: Record<BriefTypeId, BriefType> = {
  flash: {
    id: 'flash',
    label: 'Local / Organic Social',
    description: 'Short, straightforward briefs. Ideal for beginners or quick portfolio tracks. Non-exclusive, lower stakes.',
    targetWordCount: 'Under 250 words',
    defaultRegister: 'flash-brief',
    registerNotes:
      'TIER C (LOCAL/ORGANIC SOCIAL) — Under 250 words total. No dense brand history or backstory paragraphs. Focus purely on: sonic vibe (1-2 punchy sentences), 1-2 reference tracks with deltas, and basic usage terms. Every sentence must be clear and immediately actionable. Beginner-accessible. Non-exclusive terms standard. NDA not typical at this tier.',
    considerationCount: 1,
    directionCount: 2,
    referenceCount: 2,
  },
  standard: {
    id: 'standard',
    label: 'Regional / Mid-Market',
    description: 'Medium length. Introduces realistic platform restrictions, category exclusivity, and standard delivery asset requests.',
    targetWordCount: '350-450 words',
    defaultRegister: 'engineered-template',
    registerNotes:
      'TIER B (REGIONAL/MID-MARKET) — 350-450 words. Include a short campaign narrative (2-3 sentences), clear target demographics (1 sentence), and a concise delivery stems list. Category exclusivity introduced. Standard professional sync tone — detailed enough to be instructive, lean enough to remain readable. No enterprise complexity.',
    considerationCount: 2,
    directionCount: 4,
    referenceCount: 3,
  },
  anthem: {
    id: 'anthem',
    label: 'National / Enterprise',
    description: 'High complexity. Detailed enterprise-level briefs with visual storyboards, audience psychographics, strict exclusivity, and high-budget deliverables.',
    targetWordCount: '700-900 words',
    defaultRegister: 'corporate-formal',
    registerNotes:
      'TIER A (NATIONAL/ENTERPRISE) — 700-900 words. Full enterprise-level detail required: visual storyboard description, target audience psychographics, strict industry-category exclusivity restrictions, complex renewal and licensing terms, multiple delivery asset specifications (stems, formats, cutdowns). Major-brand register. High polish bar — this should feel like a real brief from a national advertiser.',
    considerationCount: 3,
    directionCount: 5,
    referenceCount: 4,
  },
};

// ============================================================
// CATEGORY METADATA
// ============================================================

export interface CategoryMeta {
  name: string;
  defaultRegister: BriefRegister;
  primaryPatterns: PatternId[];
  failureModesToAvoid: string[];
  fictionalBrandSeeds: string[];
  registerNotes: string;
  corpusGrounded: boolean;
}

export type BriefRegister =
  | 'engineered-template'
  | 'casual-screenshot'
  | 'flash-brief'
  | 'directors-prose'
  | 'presentation-deck'
  | 'concept-driven-bullet'
  | 'corporate-formal';

export type PatternId =
  | 'reference-with-delta'
  | 'leave-space-for'
  | 'aesthetic-anchor'
  | 'held-tension'
  | 'negative-space'
  | 'format-register'
  | 'warm-signoff'
  | 'operational-scaffold'
  | 'composer-as-x'
  | 'anti-brand-genre'
  | 'per-character-signature'
  | 'multi-use-case'
  | 'continuation-reset-anniversary'
  | 'music-precedes-picture'
  | 'concept-driven-craft';

// Categories in suggested-click order: most likely to least likely to be chosen
// by composers, producers, songwriters in real practice.
export const BRAND_CATEGORIES: Record<string, CategoryMeta> = {
  Sports: {
    name: 'Sports',
    defaultRegister: 'engineered-template',
    primaryPatterns: [
      'reference-with-delta',
      'aesthetic-anchor',
      'concept-driven-craft',
      'anti-brand-genre',
      'composer-as-x',
    ],
    failureModesToAvoid: [
      'Generic "epic motivation" — string builds, ascending arpeggios, "you got this" energy',
      'Trap-hybrid cliche with chopped vocal samples and sub-bass',
      'Over-orchestral cinematic when the brief asks for performance-driven',
      'Music too forward when anchor sound (equipment SFX) is the brief\'s centerpiece',
      'CrossFit-hype-video register on a precision-coded brand',
    ],
    fictionalBrandSeeds: [
      'Linder Athletics',
      'Northcrest Performance',
      'Ridgewolf',
      'Foundry Athletic',
      'Carbide',
      'Steelroot',
      'Apex Forge',
      'Velocity Athletics',
      'Terrain',
      'Meridian Sport',
      'Cove Athletic',
      'Ironveil',
      'Stormwall',
      'Sable Performance',
      'Kinetic Edge',
      'Ashford Sport',
      'Dune Active',
      'Volta',
      'Greywood',
      'Forma Athletics',
      'Cobalt Sport',
      'Blackrock Performance',
      'Elara',
      'Pulse Gear',
    ],
    registerNotes:
      'Sports advertising covers performance brands (Nike-tier), training equipment (Taylormade-tier), and lifestyle-athletic (Lululemon-tier). Briefs split between engineered-cinematic (orchestral-electronic hybrid with anchor SFX) and concept-driven craft challenges (single transition moment as the entire brief). Common ask: power without hype, precision without chaos.',
    corpusGrounded: true,
  },

  Automotive: {
    name: 'Automotive',
    defaultRegister: 'engineered-template',
    primaryPatterns: [
      'reference-with-delta',
      'leave-space-for',
      'operational-scaffold',
      'continuation-reset-anniversary',
      'anti-brand-genre',
    ],
    failureModesToAvoid: [
      'Previous-campaign rehash when brief asks for new direction',
      'Generic-rock as the engineered automotive default',
      'Over-orchestral builds on retail dealer spots',
      'Music too forward against VO and offer text',
      'Stock "vehicle reveal" cinematic palette',
    ],
    fictionalBrandSeeds: [
      'Coastline Auto Group',
      'Westridge Motors',
      'Northbeam Auto',
      'Pacific Crest Dealers',
      'Highmark Cars',
      'Sterling Auto Family',
      'Anchorline Motors',
      'Ironclad Motors',
    ],
    registerNotes:
      'Automotive briefs split between retail dealer spots (tightly engineered, timecoded structures, vocal samples, mnemonic mandates, dealer-promo cycles) and premium auto/launch spots (more interpretive, often partnership-led). Format mirrors execution: rigorous sectioning, naming conventions, deadlines surfaced. The genre default is generic-rock; briefs that escape it are the strong ones.',
    corpusGrounded: true,
  },

  Technology: {
    name: 'Technology',
    defaultRegister: 'flash-brief',
    primaryPatterns: [
      'reference-with-delta',
      'aesthetic-anchor',
      'composer-as-x',
      'negative-space',
      'anti-brand-genre',
    ],
    failureModesToAvoid: [
      'Cold synth pads with shimmering ascending arpeggios (the "tech ad" register)',
      'Bright, ambient-electronic with gentle pulse — over-claimed by competitors',
      '"Impressive but soulless" production polish',
      'Generic "modern" without specific aesthetic commitment',
      'Mistaking polish for personality',
    ],
    fictionalBrandSeeds: [
      'Linnea',
      'Loomwave',
      'Velorin',
      'Cresta',
      'Metric & Co.',
      'Pellumin',
      'Northsky Audio',
      'Dovetail',
      'Kindling Tech',
    ],
    registerNotes:
      'Technology briefs (consumer hardware, software, audio products, smart home) arrive compressed — often labeled "FLASH BRIEF" or similar. Single reference often does most of the work via extracted-features delta. Composer is treated as a peer producer, fluent in production tradition vocabulary. Confidentiality flags common. The category is saturated with one default register (bright synth, ambient pulse) — strong briefs explicitly escape it.',
    corpusGrounded: true,
  },

  Fashion: {
    name: 'Fashion',
    defaultRegister: 'presentation-deck',
    primaryPatterns: [
      'reference-with-delta',
      'aesthetic-anchor',
      'composer-as-x',
      'held-tension',
      'anti-brand-genre',
    ],
    failureModesToAvoid: [
      'Generic "runway music" — chopped vocal samples, big drops, fashion-week cliches',
      'Over-glossy production that loses personality',
      'Stock electro-pop without specific aesthetic commitment',
      'Mistaking aspirational for emotional',
    ],
    fictionalBrandSeeds: [
      'Halberd & Co.',
      'Northrun',
      'Iron Coast Apparel',
      'Linnea Studio',
      'Hollow Atelier',
      'Birch Modern',
      'Coastline Goods',
    ],
    registerNotes:
      'Fashion briefs span luxury (Gucci/Ralph Lauren tier — heritage-coded, sophisticated, often scored over editorial montages), accessible fashion (Levi\'s/Calvin Klein — more lifestyle-aspirational), and contemporary (Aritzia/Zara — modern, energetic, often with hook-led production). Briefs typically arrive as presentation decks with brand-strategic context, lookbook imagery, and partnership framing. Music must hold sophistication and personality simultaneously.',
    corpusGrounded: false,
  },

  Lifestyle: {
    name: 'Lifestyle',
    defaultRegister: 'engineered-template',
    primaryPatterns: [
      'reference-with-delta',
      'held-tension',
      'leave-space-for',
      'aesthetic-anchor',
      'negative-space',
    ],
    failureModesToAvoid: [
      'Spa-cliche register — chimes, plucked harp, breathy female vocals',
      'Yoga-studio music defaults',
      'Over-pristine production that loses "lived-in" quality',
      'Snare or percussion punching through dialogue/VO',
      'Generic "aspirational" without specific aesthetic commitment',
    ],
    fictionalBrandSeeds: [
      'Greenstem',
      'Dovetail',
      'Birch & Sage',
      'Coastline Care',
      'Northern Light Co.',
      'Hollow Mountain',
      'Steady',
      'Maple Lane',
      'Halberd Home',
    ],
    registerNotes:
      'Lifestyle covers wellness (Hers-tier intimate-diegetic), hospitality (Airbnb/Marriott — aspirational-but-grounded), home goods (IKEA/Wayfair — accessible, scenic), and DTC lifestyle (Glossier/Casper — contemporary, hook-led). Briefs are heading-template formatted but lifestyle-coded. Diegetic-but-paced is a common held tension. Bedroom-pop-adjacent genres with subtle imperfections, lived-in production. Composer is often reframed as a producer fluent in indie/DIY tradition.',
    corpusGrounded: true,
  },

  Beverage: {
    name: 'Beverage',
    defaultRegister: 'presentation-deck',
    primaryPatterns: [
      'reference-with-delta',
      'aesthetic-anchor',
      'held-tension',
      'composer-as-x',
      'continuation-reset-anniversary',
    ],
    failureModesToAvoid: [
      'After-dark/club register on daytime spots',
      'Generic "luxury jazz" sax-and-piano',
      'Over-literal whiskey-bar Americana cliches',
      'Fingerpicked acoustic-folk default for Tennessee/bourbon brands',
      'Generic "refreshment energy" without specific commitment',
    ],
    fictionalBrandSeeds: [
      'Halberd Reserve',
      'Northvale Distilling Co.',
      'Iron Coast Whiskey',
      'Fielder & Sons',
      'Black Pine Bourbon',
      'Holloway Spirits',
      'Riverend Rye',
      'Kindling Co.',
      'Westbrook Beverage',
      'Coastline Soda',
    ],
    registerNotes:
      'Beverage spans heritage spirits (Jack Daniels/Basil Hayden tier — sophisticated, atmospheric, partnership-coded), premium spirits (Macallan/Glenfiddich — heritage-foundation), beer (Heineken/Coors — lifestyle, often partnership), non-alcoholic (Coca-Cola/Pepsi — broad appeal, often anthemic), and emerging (Liquid Death/Olipop — personality-led, anti-category-default). Spirits briefs lean presentation-deck format with brand-strategic context and lifestyle imagery. Non-alcoholic briefs lean broader/lighter. Both reward composers who can read brand-strategy language.',
    corpusGrounded: true,
  },

  Food: {
    name: 'Food',
    defaultRegister: 'casual-screenshot',
    primaryPatterns: [
      'reference-with-delta',
      'aesthetic-anchor',
      'composer-as-x',
      'leave-space-for',
      'held-tension',
    ],
    failureModesToAvoid: [
      'Over-literal mickey-mousing of every visual gag',
      'Sitcom-cue cliches (boing, slide whistle) where brief asks for theatricality',
      'Reading culturally-specific references too literally (e.g. French pop for a croissant pizza)',
      'Big timpani on theatrical-comedic briefs',
      'Generic "food joy" without specific aesthetic commitment',
    ],
    fictionalBrandSeeds: [
      'Coppice Modern',
      'Greenstem',
      'Birchhouse',
      'Hollow & Co.',
      'Maple Lane Foods',
      'Fielder Pantry',
      'Quill Bakery',
      'Fielder Foods',
      'Coastline Kitchen',
      'Northcrest Pet',
    ],
    registerNotes:
      'Food covers fast food/QSR (McDonald\'s/Wendy\'s — energetic, character-led), packaged food (Cheerios/Oreos — broad appeal, often nostalgic), pet food (Fancy Feast — theatrical-comedic Broadway register), restaurants (Chipotle — emotional storytelling), and emerging brands (newer DTC food — personality-led, often comedic). Comedic/theatrical is the most distinctive — Broadway-style with verbatim lyrics, vocal-performance focus. Single-product launch briefs are more compressed, demo-love driven, casual-relational.',
    corpusGrounded: true,
  },

  Healthcare: {
    name: 'Healthcare',
    defaultRegister: 'engineered-template',
    primaryPatterns: [
      'held-tension',
      'leave-space-for',
      'negative-space',
      'aesthetic-anchor',
      'music-precedes-picture',
    ],
    failureModesToAvoid: [
      'Over-sentimental swelling strings on emotional moments',
      'Piano-tinkle cliches under doctor narration',
      'Music that "tells viewers what to feel" rather than supporting',
      'Solo cello "moment" cliche on the emotional anchor scene',
      'Resolved IV-V-I cadences on recovery/return scenes',
      'Generic "trust" register — slow piano arpeggios with pad swells',
    ],
    fictionalBrandSeeds: [
      'Hardthorne Health',
      'Mendwell',
      'Cresta Health',
      'Northvale Medical',
      'Steady Health',
      'Hollow Care',
      'Pellumin',
      'Coastline Health',
      'Birch Wellness',
    ],
    registerNotes:
      'Healthcare covers pharmaceutical (BMS/Pfizer tier — formal heading-template, often pre-picture, restraint as the assignment), retail health (CVS/Walgreens — accessible, more lifestyle-coded), digital health (Headspace/Calm — meditative, restrained, often atmospheric), and DTC health (Hims/Ro — direct, accessible, lifestyle-aspirational). Pharmaceutical briefs particularly demand the held tension "emotional but not sentimental." Music-precedes-picture deployment is more common than in other categories.',
    corpusGrounded: true,
  },

  Financial: {
    name: 'Financial',
    defaultRegister: 'engineered-template',
    primaryPatterns: [
      'held-tension',
      'leave-space-for',
      'aesthetic-anchor',
      'reference-with-delta',
      'composer-as-x',
    ],
    failureModesToAvoid: [
      'Generic "trust" piano-and-pad register',
      'Over-corporate orchestral with predictable arc',
      'Stock "confidence" rock-anthem cliches',
      'Mistaking gravitas for sentimentality',
      'Music that lectures rather than supports',
    ],
    fictionalBrandSeeds: [
      'Ironclad Capital',
      'Highmark Financial',
      'Sterling Heritage Bank',
      'Northbeam Investments',
      'Coastline Capital',
      'Foundry Financial',
      'Pacific Crest Banking',
    ],
    registerNotes:
      'Financial covers traditional banking (JP Morgan/Charles Schwab — heritage, gravitas, often dramatic narrative), wealth management (Vanguard/Fidelity — aspirational, restrained), fintech (Robinhood/Cash App — modern, accessible, often hook-led), and insurance (Geico/Allstate — character-led, often comedic). Briefs typically demand confidence without arrogance, gravitas without sentimentality. The category is one of the highest-spend in advertising; production polish bar is high.',
    corpusGrounded: false,
  },
};

// ============================================================
// PATTERN LIBRARY
// ============================================================

export interface Pattern {
  id: PatternId;
  name: string;
  tier: 1 | 2 | 3;
  excludeFromV1?: boolean;
  description: string;
  whenToDeploy: string;
  subPatterns: string[];
  antiPatterns: string[];
  exampleVoice: string[];
}

export const PATTERNS: Record<PatternId, Pattern> = {
  'reference-with-delta': {
    id: 'reference-with-delta',
    name: 'Reference With Delta',
    tier: 1,
    description:
      'Pair every reference track with a named adjustment that tells the composer where to deviate from the reference. The reference establishes the destination; the delta tells the composer how not to copy it.',
    whenToDeploy:
      'In nearly every brief that includes references (which should be most briefs). At least one reference per brief should carry a delta.',
    subPatterns: [
      'Genre/instrumentation delta ("but with brighter instrumentation")',
      'Mood/lane delta ("leaning toward their upbeat side rather than melancholic")',
      'Density delta ("could use a little something more" / "still too sparse")',
      'Lyrics-stripped delta ("lyrics not right, but the energy is")',
      'Self-doubting delta ("might be too dramatic but cool example of...")',
      'Extracted-features delta ("what people are liking about it is the dustiness, the collage-like effects")',
      'Time-stamped delta ("see 1:15-1:32")',
      'Translation delta ("replicate as best you can using your sonic palette")',
    ],
    antiPatterns: [
      'Flat reference list with no annotation',
      'Imitate-exactly directives (legal risk + creative shutdown)',
      'Self-contradictory deltas ("like this, but completely different")',
    ],
    exampleVoice: [
      '"Think Prodigy \'Breathe\', or the Goldeneye OST but with brighter instrumentation and more dynamic."',
      '"The Pusha T reference is still too slow, but you can hear those real drum samples chopped up with the guitar lick."',
    ],
  },

  'leave-space-for': {
    id: 'leave-space-for',
    name: 'Leave Space For [X]',
    tier: 1,
    description:
      'Tell the composer explicitly what the music must subordinate itself to — VO, sound design, dialogue, vocal sample, character action, etc. This is the most universal pattern in real briefs. Music in sync is almost never the lead element.',
    whenToDeploy:
      'In every brief. Name what specifically the music defers to.',
    subPatterns: [
      'Continuous deference (track stays consistently underneath)',
      'Moment-specific space (drop or gap at a defined timecode)',
      'Late entry / gated entry (music silent until a defined cue)',
      'Co-composition with the lead element (music and VO composed together)',
      'Diegetic-paced (sounds like it belongs in the world, but cuts to picture)',
      'Per-scene calibration (foreground/background varies by scene)',
      'Anti-failure-mode protection ("no pausing for jokes")',
    ],
    antiPatterns: [
      'Generic "support the VO" without specificity',
      'Music-as-equal-partner framing (almost never true in real sync)',
      'Missing entirely from the brief',
    ],
    exampleVoice: [
      '"The more your track can work with/around the VO, the better — they like the idea of the VO almost feeling somewhat integrated into the flow of the music, almost acting like spoken word poetry."',
      '"There should be NO MUSIC at all from 0:00 - 0:26. Cue when the barrel roll appears."',
    ],
  },

  'aesthetic-anchor': {
    id: 'aesthetic-anchor',
    name: 'Single-Word Aesthetic Anchor',
    tier: 1,
    description:
      'Lock onto one defining word that does compositional heavy lifting. The word should be sonically specific, slightly unusual in everyday usage, and tell the composer something concrete that paragraphs of mood description couldn\'t.',
    whenToDeploy:
      'In most briefs. Pick one anchor word and commit. Support with one specific clue (a reference, a production note, a negation).',
    subPatterns: [
      'Production aesthetic (raw, dusty, lived-in, polished, gritty)',
      'Emotional posture (swagger, tenacious, defiant, restrained)',
      'Genre-coded shorthand (bedroom pop, plunderphonics, mid-2000s club)',
      'Structural quality (bouncy, propulsive, sparse, kinetic)',
      'Compound modifier (aggressively fun, deliberately unhurried)',
      'Spatial/scene-evocative (golden hour, vastness, underwater)',
      'Negation-anchor (defining quality is what music must NOT be)',
    ],
    antiPatterns: [
      'Adjective stacks without anchoring (modern, fresh, energetic, dynamic)',
      'Overused anchors (cinematic, epic, organic) without supporting specificity',
      'Made-up jargon (real briefs use existing words with conviction)',
    ],
    exampleVoice: [
      '"Aggressively fun."',
      '"What people are liking about this track is the unexpectedness, dustiness, the collage-like effects."',
    ],
  },

  'held-tension': {
    id: 'held-tension',
    name: 'Held Tension As Creative Protection',
    tier: 1,
    description:
      'Define the creative target as the space between two opposing qualities, not a single point. "X but not Y" or "X yet Z" formulations protect against predictable failure modes.',
    whenToDeploy:
      'In most interpretive briefs. Use 1-3 held tensions per brief, not zero and not six.',
    subPatterns: [
      '"X but not Y" — single tension, named failure mode',
      '"X yet Z" — paired qualities with no implied failure',
      'Stacked tension (3+ qualities held simultaneously, rare)',
      'Compound modifier as compressed tension',
      'Volume/intensity calibration tension ("if it crosses into emotional drama, you\'ve lost it")',
      'Sub-genre lineage tension (genre with named departures)',
      'Function tension (music must serve two opposing roles — diegetic but paced)',
    ],
    antiPatterns: [
      'Single-quality directives with no protection against failure',
      'False tensions (opposites that cancel each other out)',
      'Over-stacked tensions (5+ qualities)',
      'Tensions resolved by hedging ("not too much")',
    ],
    exampleVoice: [
      '"Human and emotional without becoming overly sentimental."',
      '"Modern & polished, with clean production with subtle imperfections to make it feel organic and lived-in."',
      '"Cosmic but lighthearted — maybe a little satirical. Not taking it too seriously, but still cosmic."',
    ],
  },

  'negative-space': {
    id: 'negative-space',
    name: 'Negative Space Defined With Precision',
    tier: 1,
    description:
      'Tell the composer specifically what NOT to do — named failure modes, named genres-to-avoid, named cliches-to-protect-against. The negation must be specific, not generic.',
    whenToDeploy:
      'In most briefs. Use 1-3 named negations, paired with positive direction.',
    subPatterns: [
      'Genre-to-avoid (anti-genre)',
      'Specific instrument or production exclusion ("no big timpani")',
      'Failure-mode naming ("overly sentimental")',
      'Reference-as-failure ("this shouldn\'t feel like a Transformers trailer")',
      'Anti-brand-genre framing (escaping brand\'s own past)',
      'YES/NO list format (formal heading-template only)',
      'Escape clause negation ("but if you can do it tastefully, the door\'s open")',
      'Reasoned negation ("the VO is a poem so we should avoid lyrics")',
    ],
    antiPatterns: [
      'Generic negation ("avoid anything generic")',
      'Negation without alternative direction',
      'Over-stacked negations (6+ failure modes)',
      'Cultural references the composer might not get',
    ],
    exampleVoice: [
      '"This shouldn\'t feel like a Transformers trailer."',
      '"DO NOT want the music to feel like it belongs on a typical/expected \'hype Army\' ad."',
    ],
  },

  'format-register': {
    id: 'format-register',
    name: 'Brief Delivery Format Equals Output Register',
    tier: 2,
    description:
      'The physical format of the brief (heading template, casual screenshot, FLASH BRIEF, director\'s prose, presentation deck) signals the kind of music it asks for. Match the brief\'s register to its format.',
    whenToDeploy:
      'In every brief. Format selection should be the first creative decision after category selection.',
    subPatterns: [
      'Formal heading-template (engineered output)',
      'Presentation deck (interpretive partnership-led)',
      'Casual screenshot (working-pro relational)',
      'FLASH BRIEF compressed prestige',
      'Director\'s prose (scene-driven film/animation)',
      'Multi-direction format (version-it-out)',
      'Concept-driven single-page bullet brief',
    ],
    antiPatterns: [
      'Format-mood mismatch (formal PDF asking for raw beatmaker energy)',
      'Single-format generator output (every brief looking identical)',
      'Over-formal in casual contexts',
    ],
    exampleVoice: [
      '"FLASH BRIEF: [Brand]"',
      '"UPDATED [BRAND] BRIEF [DATE]"',
    ],
  },

  'warm-signoff': {
    id: 'warm-signoff',
    name: 'Warm Sign-Off Archetype',
    tier: 2,
    description:
      'Close interpretive briefs with personal warmth — difficulty acknowledgment, anticipation, open-door collaboration, or first-name signature. Close engineered briefs operationally with no warmth needed.',
    whenToDeploy:
      'In ~40% of briefs (the interpretive ones). Engineered briefs close operationally.',
    subPatterns: [
      'Difficulty-acknowledgment + confidence ("we know it\'s a challenge but we trust you")',
      'Anticipation-warmth ("looking forward to what you do with this")',
      'Open-door collaborative ("if you have questions, let me know")',
      'Trust signal with light caveat ("please don\'t share these")',
      'First-name signature',
      'Continued-relationship gesture ("we\'ll send picture when we have it")',
      'Invitational-permission close ("open to any approach we haven\'t thought of")',
    ],
    antiPatterns: [
      'Generic warmth ("thanks!" alone)',
      'Warmth-without-substance on engineered briefs',
      'Over-effusive close (multiple exclamation marks, performative)',
    ],
    exampleVoice: [
      '"We know it\'s quite the challenge. But an extremely exciting one. Thanks for taking this on."',
      '"Looking forward to hearing what you come up with! Thanks."',
    ],
  },

  'operational-scaffold': {
    id: 'operational-scaffold',
    name: 'Operational Scaffolding As Register Signal',
    tier: 2,
    description:
      'The amount of non-creative operational information (naming conventions, deadlines, submission portals, file formats) signals the brief\'s working register. Engineered briefs surface heavy scaffolding; casual briefs minimize it.',
    whenToDeploy:
      'In every brief. Match scaffold density to format and category.',
    subPatterns: [
      'Full operational header (engineered template)',
      'Compressed ops (3-5 lines, casual or prestige)',
      'Embedded ops (woven into prose)',
      'Relational ops shorthand ("as always")',
      'Deferred ops ("picture coming this week")',
      'Minimal-or-absent ops (director\'s prose)',
      'NDA / sensitivity flags',
    ],
    antiPatterns: [
      'Over-scaffolded interpretive brief',
      'Missing essential ops on competitive brief',
      'Inconsistent ops density within one brief',
    ],
    exampleVoice: [
      '"Naming Convention: Sonant_BrandName_ProjectName_Initials_TrackTitle_Date"',
      '"Inbox link as always, is here..."',
    ],
  },

  'composer-as-x': {
    id: 'composer-as-x',
    name: 'Composer-As-X Identity Reframing',
    tier: 2,
    description:
      'Tell the composer to inhabit a specific identity other than "ad composer" — beatmaker, recording artist, film composer, anthem songwriter, sonic-branding designer. The reframe gives composer a more vivid creative posture than generic genre direction.',
    whenToDeploy:
      'In ~40-50% of briefs. Most useful for interpretive and casual briefs. Engineered briefs typically don\'t reframe.',
    subPatterns: [
      'Recording-artist identity ("write as if this were the instrumental of a legit record")',
      'Beatmaker identity ("pitching beats to Pusha T")',
      'Film composer identity (think in characters, leitmotifs)',
      'Stage/theatrical composer identity (Broadway register)',
      'Anthem-songwriter identity (stadium anthem, sonic logo)',
      'Sonic-branding/logo-composer identity (designing audio cues for moments)',
      'Producer-as-archivist identity (mining a sonic vocabulary like plunderphonics)',
      'Genre-native identity (write as a working musician native to this genre)',
    ],
    antiPatterns: [
      'No identity (default ad-composer frame produces ad-shaped tracks)',
      'Aspirational identity reframe with no support ("write as if you were John Williams")',
      'Multiple conflicting identity reframes',
      'Identity reframe without genre context',
    ],
    exampleVoice: [
      '"Something like a beatmaker would be pitching to Pusha T, Kendrick, etc via cleared samples."',
      '"Your track should feel like the instrumental of a legit record. If it feels \'ad-y\', it\'ll be a miss."',
    ],
  },

  'anti-brand-genre': {
    id: 'anti-brand-genre',
    name: 'Anti-Brand-Genre Framing',
    tier: 2,
    description:
      'Position the brief against the brand\'s own past, the category\'s default register, or a specific competitor\'s sonic move. Reveals strategic shifts in brand positioning.',
    whenToDeploy:
      'In ~25-30% of briefs. High-signal pattern; overuse would make every brand seem to be repositioning.',
    subPatterns: [
      'Anti-prior-campaign ("not connected to our previous music")',
      'Anti-category-default ("not Nashville" / "not hype Army")',
      'Anti-competitor (specific competitor\'s signature sonic move excluded)',
      'Anti-cliche-of-creative-idea (preempting lazy interpretation)',
      'Anti-comfort-zone (forcing brand to evolve past loved-but-stale register)',
      'Genre-iteration variant (softer "version it out" framing)',
    ],
    antiPatterns: [
      'Generic anti-genre framing without specific escape target',
      'Anti-genre framing without alternative direction',
      'Contradictory anti-genre framing',
      'Anti-competitor framing without specifying the move',
    ],
    exampleVoice: [
      '"We\'re going in a new direction, not connected to our previous music, starting fresh."',
      '"Nothing trying to sound too \'Nashville\' at all anymore."',
    ],
  },

  'per-character-signature': {
    id: 'per-character-signature',
    name: 'Per-Character / Per-Element Sonic Signatures',
    tier: 3,
    description:
      'Assign specific sonic identities to characters, creatures, objects, or scenes. Leitmotif assignment. Film/animation/game-native pattern.',
    whenToDeploy:
      'In ~60-70% of film, animation, and narrative-cinematic game briefs. Almost never in spot ad briefs.',
    subPatterns: [
      'Character leitmotifs (recurring melodic/harmonic identity per character)',
      'Object/element leitmotifs (significant objects with sonic identity)',
      'Scene/location leitmotifs (different sonic registers per location)',
      'Action-type signatures (combat, exploration, victory)',
      'Effect signatures (sound-design as identity marker)',
      'Faction/group signatures (game-native)',
    ],
    antiPatterns: [
      'Per-character signatures in spot briefs (no time for character development)',
      'Too many signatures (12+ themes is unworkable)',
      'Vague signature direction ("each character has a unique voice")',
      'Mixing signature types confusingly',
    ],
    exampleVoice: [
      '"Each creature should have a musical or effect signature. The music should score their actions."',
    ],
  },

  'multi-use-case': {
    id: 'multi-use-case',
    name: 'Multi-Use-Case Design',
    tier: 3,
    description:
      'The track must work across multiple distinct usage contexts simultaneously — foreground (commercials), background (hold music), connective (booking flow). Anthem-defining pattern.',
    whenToDeploy:
      'In 80%+ of anthem and brand-identity briefs. Almost never in spot briefs.',
    subPatterns: [
      'Touchpoint enumeration (boarding, hold music, retail, social)',
      'Length flexibility built in (cuttable to any duration)',
      'Foreground/background dual register',
      'Multiple delivery formats (full mix, instrumental, stems, mnemonic)',
      'Sonic identity logic (recognizable hook persists across contexts)',
      'Cuttable architecture (natural cut points specified)',
    ],
    antiPatterns: [
      'Multi-use-case framing on spot briefs',
      'Touchpoint enumeration without compositional consequence',
      'Length flexibility without architectural guidance',
    ],
    exampleVoice: [
      '"The music will be used widely across multiple use cases, including: boarding and de-planing, hold music, booking a reservation, commercial campaign work, social applications."',
    ],
  },

  'continuation-reset-anniversary': {
    id: 'continuation-reset-anniversary',
    name: 'Continuation / Reset / Anniversary Stances',
    tier: 3,
    description:
      'Take an explicit stance toward the brand\'s history. Continuation ("more of that with adjustments"), Reset ("abandon what came before"), or Anniversary ("celebrate what came before").',
    whenToDeploy:
      'In every brief — implicitly or explicitly. Stanceless briefs feel ahistorical.',
    subPatterns: [
      'Continuation refinement ("more of what we\'ve been doing")',
      'Continuation year-over-year iteration',
      'Reset explicit anti-prior',
      'Reset anti-category-default',
      'Anniversary legacy as foundation',
      'Anniversary milestone celebration',
      'Stealth-stance (implicit history, "you know our work")',
    ],
    antiPatterns: [
      'Stanceless briefs',
      'Mixed stances (continuation + reset + anniversary simultaneously)',
      'Reset without alternative direction',
      'Anniversary without legacy specifics',
      'Continuation without delta',
    ],
    exampleVoice: [
      '"Time is upon us to once again make an update to our existing song." (Continuation)',
      '"We\'re going in a new direction, not connected to our previous music." (Reset)',
      '"The brand is preparing to celebrate its 100-year anniversary." (Anniversary)',
    ],
  },

  'music-precedes-picture': {
    id: 'music-precedes-picture',
    name: 'Music-Precedes-Picture',
    tier: 3,
    description:
      'Music is created before the final visual edit exists. Composer establishes the tonal anchor that picture will be cut to. Inverts the standard chain.',
    whenToDeploy:
      'In ~15-20% of healthcare, anthem, and pre-production briefs. Almost never in retail spot briefs.',
    subPatterns: [
      'No picture, scratch VO only',
      'Rough cut, will be refined',
      'Picture pending, will arrive mid-process',
      'Picture exists but music takes priority',
      'Music-as-creative-driver framing',
    ],
    antiPatterns: [
      'Music-precedes-picture framing without compositional consequence',
      'Inconsistent picture status',
      'Music-precedes-picture in spot categories where picture is locked',
      'Over-specifying timing without picture',
    ],
    exampleVoice: [
      '"Since we do not yet have picture to work to, composers should focus on creating tracks that establish tone and momentum."',
    ],
  },

  'concept-driven-craft': {
    id: 'concept-driven-craft',
    name: 'Concept-Driven Craft Brief',
    tier: 3,
    description:
      'The brief orbits a single creative idea or craft challenge as its entire creative center. Other parameters (genre, instrumentation, tempo) are wide-open because the concept is the test.',
    whenToDeploy:
      'In ~10-15% of briefs across categories. Most common in sports equipment with brand-line moments, tech sonic-logo work, partnership campaigns.',
    subPatterns: [
      'Brand-line moment concept (score one VO/visual moment)',
      'Partnership-thesis concept (express a partnership idea through music)',
      'Single-craft-challenge concept (solve a specific compositional tension)',
      'Sonic-identity-from-scratch concept',
      'Translate-the-emotion concept',
      'Conceptual-twist concept',
    ],
    antiPatterns: [
      'Concept-driven framing without genre permission (over-specifying parameters)',
      'Multiple competing concepts',
      'Concept with no compositional consequence',
      'Concept-driven framing on engineered briefs',
    ],
    exampleVoice: [
      '"This is all about including audio cues around the [brand line] VO."',
      '"Open to any and all ideas to emphasize the visual transitions on the spot with audio cues."',
    ],
  },
};

// ============================================================
// SCRUB LIST
// ============================================================
//
// Real names, platforms, and identifiers the generator must NEVER emit.
// The server action will pass this list to the LLM with explicit
// instructions to avoid these terms in any generated output.

export const SCRUB_LIST = {
  studios: [
    'SQECS',
    'Squeak E Clean',
    'Squeak E. Clean Studios',
    'Squeak E. Clean',
  ],
  platforms: [
    'Disco',
    'disco.ac',
    's.disco.ac',
  ],
  realPeople: [
    'Rob Schustack',
    'Jack Chown',
    'Tommy Fields',
    'Damian',
    'Rob Barbato',
  ],
  realBrands: [
    'Nike', 'Apple', 'Tesla', 'Adidas', 'Patagonia', 'Spotify',
    'Liquid Death', 'Rolex', 'Mercedes-Benz', 'Mercedes', 'Airbnb',
    'Gucci', 'Red Bull', 'Toyota', 'Taylormade', 'TaylorMade',
    'Basil Hayden', 'Jack Daniels', "Jack Daniel's", 'Ferrari', 'Chivas',
    'BMS', 'Bristol-Myers', 'FIFA', 'Fancy Feast', 'United Airlines',
    'United', 'US Army', 'Hers', 'Papa Johns', "Papa John's",
    'American Airlines', 'AA', 'Coldplay', 'OneRepublic',
  ],
  realCompositions: [
    'Rhapsody in Blue',
    'Counting Stars',
    'Viva La Vida',
  ],
  studioTaglineRule:
    'The studio identity in every generated brief is "Sonant" or "Sonant Studio". Never use any other studio name, music house name, or production company name.',
  submissionRule:
    'The submission line in every generated brief should read "SUBMIT VIA SONANT" or use a Sonant-specific submit URL. Never reference disco.ac or any other submission platform.',
};

// ============================================================
// HELPERS
// ============================================================

export function getActivePatterns(): Pattern[] {
  return Object.values(PATTERNS).filter((p) => !p.excludeFromV1);
}

export function getCategoryByName(name: string): CategoryMeta | undefined {
  return BRAND_CATEGORIES[name];
}

export function getCategoryDisplayList(): Array<{ name: string }> {
  return Object.values(BRAND_CATEGORIES).map((c) => ({
    name: c.name,
  }));
}

export function getBriefTypeById(id: BriefTypeId): BriefType {
  return BRIEF_TYPES[id];
}

export function getBriefTypeDisplayList(): Array<{ id: BriefTypeId; label: string; description: string }> {
  return Object.values(BRIEF_TYPES).map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
  }));
}