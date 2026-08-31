export type LoadingBriefInput = {
  mode: 'brand' | 'film' | 'games';
  category: string | null;
  genres: string[];
  moods: string[];
  withVocals: boolean;
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const OPENERS: Record<LoadingBriefInput['mode'], string[]> = {
  brand: [
    'Building your custom music brief…',
    'Opening a new campaign universe…',
    'Sketching a brand that does not exist yet…',
  ],
  film: [
    'Building your custom music brief…',
    'Dimming the lights on a new scene…',
    'Finding the first frame that needs music…',
  ],
  games: [
    'Building your custom music brief…',
    'Loading a world the player has not entered…',
    'Tuning the first loop of a new game…',
  ],
};

const MODE_LINES: Record<LoadingBriefInput['mode'], string[]> = {
  brand: [
    'Exploring unique brand names and product concepts…',
    'Inventing a client with opinions and a deadline…',
    'Making up a campaign that still has to feel real…',
    'Naming a product no one can buy yet…',
  ],
  film: [
    'Inventing movie plots that need intense music…',
    'Rewriting a scene until the silence has a job…',
    'Casting a fictional production that still needs a cue…',
    'Finding the cut where the score has to arrive…',
  ],
  games: [
    'Designing a loop you could live inside for an hour…',
    'Mapping a game moment the player will hear too many times…',
    'Building a world that needs music but not a theme park…',
    'Hiding the seam so the loop never announces itself…',
  ],
};

const CATEGORY_LINES: Record<string, string[]> = {
  Sports: [
    'Looking for motion that still leaves room to breathe…',
    'Chasing drive without turning it into a montage…',
  ],
  Automotive: [
    'Tuning something sleek enough to sit under chrome…',
    'Finding horsepower that does not shout…',
  ],
  Technology: [
    'Sketching a future that does not sound like a stock synth pack…',
    'Keeping the circuitry human…',
  ],
  Fashion: [
    'Walking a runway that only exists for thirty seconds…',
    'Looking for chic that still has a pulse…',
  ],
  Lifestyle: [
    'Staging a life that looks edited but still warm…',
    'Finding the quiet luxury version of this mood…',
  ],
  Beverage: [
    'Pouring a world that feels cold, bright, and a little too fun…',
    'Looking for fizz that is not a ukulele…',
  ],
  Food: [
    'Cooking up a table you can hear…',
    'Finding appetite without the grocery-store piano…',
  ],
  Healthcare: [
    'Keeping the care human, not clinical…',
    'Looking for trust that does not sound like a waiting room…',
  ],
  Financial: [
    'Making money feel like a decision, not a jingle…',
    'Looking for steadiness without the hold-music smile…',
  ],
  Drama: [
    'Leaving space for the actor to finish the sentence…',
    'Looking for feeling that does not explain the scene…',
  ],
  Documentary: [
    'Listening for the real room under the narration…',
    'Finding score that does not decorate the facts…',
  ],
  Horror: [
    'Turning the lights down until the air feels wrong…',
    'Looking for dread you feel before you hear…',
  ],
  Action: [
    'Timing the hit so the picture still leads…',
    'Building heat without a trailer-music pileup…',
  ],
  'Romance / Indie': [
    'Scoring the thing they are not saying…',
    'Keeping the piano from announcing the kiss…',
  ],
  'Combat / Action': [
    'Writing a fight you could loop without getting tired of it…',
    'Giving the encounter a pulse, not a generic raid…',
  ],
  'Exploration / Open World': [
    'Walking the map until the place has a sound…',
    'Making the horizon feel inhabited…',
  ],
  'Boss Battle': [
    'Giving this enemy a theme it can actually own…',
    'Making the last fight sound like a person, not a choir pack…',
  ],
  'Main Menu / Title': [
    'Writing the first impression of a whole world…',
    'Inviting the player in without a fanfare…',
  ],
  'Puzzle / Casual': [
    'Finding music that lets you think…',
    'Keeping the loop friendly after the tenth minute…',
  ],
  'Horror / Stealth': [
    'Holding the tension just under the floorboards…',
    'Making quiet do more work than a jump…',
  ],
  'Cinematic / Cutscene': [
    'Scoring a scene the player already lives in…',
    'Keeping the cutscene inside this game’s world…',
  ],
};

const GENRE_LINES: Record<string, string[]> = {
  Cinematic: ['Pulling the camera back until the harmony has room…'],
  Electronic: ['Patching a synth that does not sound like every other brief…'],
  'Hip-Hop': ['Chopping a pocket that can sit under picture…'],
  Rock: ['Looking for grit that still leaves space for VO…'],
  Pop: ['Finding a hook that will not steal the spot…'],
  Orchestral: ['Asking the orchestra to do less, on purpose…'],
  Ambient: ['Stretching air until it starts to feel like a place…'],
  'Folk / Acoustic': ['Keeping the guitar close-miked and a little imperfect…'],
  Indie: ['Hunting a record that sounds handmade, not playlist-safe…'],
  'R&B / Soul': ['Looking for warmth in the drums, not just the vocal…'],
  Alternative: ['Tilting the palette a few degrees off-center…'],
  Country: ['Finding story in the rhythm section, not the stereotype…'],
  Jazz: ['Leaving space between the notes so the scene can talk…'],
  'Neo-Classical': ['Keeping the piano honest, not cinematic by default…'],
};

const MOOD_LINES: Record<string, string[]> = {
  Triumphant: ['Letting the win arrive late, not on the first downbeat…'],
  Intense: ['Turning the temperature up without blowing the speakers…'],
  Energetic: ['Looking for motion that still has a spine…'],
  Powerful: ['Finding weight that does not need to shout…'],
  Driving: ['Keeping the engine in the room, not just the kick…'],
  Gritty: ['Scuffing the edges so it does not sound polished to death…'],
  Focused: ['Clearing the clutter so one idea can hold…'],
  Relentless: ['Building a pulse that does not blink…'],
  Sleek: ['Smoothing the surface without sanding off the character…'],
  Sophisticated: ['Looking for taste that still has blood in it…'],
  Dynamic: ['Leaving somewhere for the cue to go…'],
  Bold: ['Making a choice loud enough to remember…'],
  Epic: ['Resisting the choir until the picture actually asks…'],
  Majestic: ['Giving it height without the postcard ending…'],
  Innovative: ['Looking for a sound that feels new for this brief, not new in general…'],
  Clean: ['Wiping the mix down until only the useful parts stay…'],
  Futuristic: ['Sketching tomorrow without the stock arpeggio…'],
  Minimal: ['Taking things out until the brief gets sharper…'],
  Inspiring: ['Finding lift that does not feel like a key-change ad…'],
  Curious: ['Leaving a question mark in the harmony…'],
  Pulsing: ['Getting the body of the track to breathe…'],
  Chic: ['Finding cool that still moves…'],
  Ethereal: ['Thinning the air without losing the floor…'],
  Sultry: ['Keeping it close and a little dangerous…'],
  Playful: ['Letting it wink without turning into a cartoon…'],
  Upbeat: ['Looking for sun that is not a stock smile…'],
  Intimate: ['Moving the mic closer…'],
  Moody: ['Letting a little weather into the room…'],
  Vibrant: ['Turning the color up on the rhythm…'],
  Refreshing: ['Opening a window in the arrangement…'],
  Warm: ['Keeping the analog heat, losing the syrup…'],
  Nostalgic: ['Remembering something that never quite happened…'],
  Quirky: ['Finding the odd detail that makes it specific…'],
  Crisp: ['Snapping the transients until it feels cold and clean…'],
  Empathetic: ['Listening first, then writing around the person…'],
  Trustworthy: ['Making the harmony feel like it will keep its word…'],
  Hopeful: ['Leaving a door open at the end of the phrase…'],
  Grounded: ['Keeping both feet on the floorboards…'],
  Steady: ['Finding a pulse you could walk to…'],
  Calming: ['Slowing the room down without putting it to sleep…'],
  Melancholic: ['Letting the sad part stay a little unfinished…'],
  Tense: ['Tightening the wire and not cutting it yet…'],
  Haunting: ['Leaving a note in the air after the picture moves on…'],
  Eerie: ['Making the quiet feel occupied…'],
  Bittersweet: ['Holding two feelings in the same chord…'],
  Suspenseful: ['Waiting one more bar than is comfortable…'],
  Dramatic: ['Saving the gesture for the moment that earns it…'],
  Serene: ['Smoothing the water without making it empty…'],
  Atmospheric: ['Building weather, not wallpaper…'],
  Emotional: ['Getting specific about the feeling, not the adjective…'],
  Mysterious: ['Hiding the resolution on purpose…'],
  Uplifting: ['Lifting without the motivational-poster swell…'],
  Adventurous: ['Opening a path the player has not walked yet…'],
  Ominous: ['Putting something in the basement of the mix…'],
  Heroic: ['Finding courage that is not a brass fanfare…'],
};

const REFERENCE_LINES = [
  'Studying reference tracks to find the right themes…',
  'Looking up real records so the references are actually on the tape…',
  'Checking credits so we do not invent an orchestra…',
  'Listening sideways through two very different records…',
];

const VOCAL_LINES = [
  'Leaving a lane for a vocal that will not steal the picture…',
  'Sketching words that can sit under the scene…',
];

const CLOSERS = [
  'Laying out the last page…',
  'Tightening the ask until it is one clear job…',
  'Printing the brief and walking it down the hall…',
];

function linesFor(map: Record<string, string[]>, key: string | null | undefined): string[] {
  if (!key) return [];
  return map[key] ?? [];
}

export function buildLoadingMessages(input: LoadingBriefInput): string[] {
  const messages: string[] = [pick(OPENERS[input.mode])];

  const middle: string[] = [pick(MODE_LINES[input.mode])];

  const categoryPool = linesFor(CATEGORY_LINES, input.category);
  if (categoryPool.length) middle.push(pick(categoryPool));

  for (const genre of input.genres.slice(0, 2)) {
    const pool = linesFor(GENRE_LINES, genre);
    if (pool.length) middle.push(pick(pool));
  }
  for (const mood of input.moods.slice(0, 2)) {
    const pool = linesFor(MOOD_LINES, mood);
    if (pool.length) middle.push(pick(pool));
  }

  middle.push(pick(REFERENCE_LINES));
  if (input.withVocals) middle.push(pick(VOCAL_LINES));

  const uniqueMiddle = [...new Set(middle.filter(Boolean))];
  while (uniqueMiddle.length > 4) {
    uniqueMiddle.splice(1 + Math.floor(Math.random() * (uniqueMiddle.length - 1)), 1);
  }

  messages.push(...uniqueMiddle);
  messages.push(pick(CLOSERS));
  return messages;
}
