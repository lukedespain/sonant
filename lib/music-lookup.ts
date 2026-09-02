const USER_AGENT = 'SonantBriefs/1.0 (https://sonant.ac; hello@sonant.ac)';
const MB_GAP_MS = 1100;

export type ReferenceCandidate = {
  artist: string;
  title: string;
};

export type GroundedTrack = {
  artist: string;
  title: string;
  album: string | null;
  year: string | null;
  genre: string | null;
  credits: string[];
  tags: string[];
  summary: string | null;
  listenUrl: string | null;
  source: 'itunes' | 'musicbrainz' | 'both';
};

const YOUTUBE_ID = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i;

export function parseReferenceTrack(track: string): ReferenceCandidate | null {
  const comma = track.indexOf(',');
  if (comma === -1) return null;
  const artist = track.slice(0, comma).trim();
  const title = track.slice(comma + 1).trim();
  if (!artist || !title) return null;
  return { artist, title };
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be|music\.youtube\.com/i.test(url);
}

function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

function youtubeSearchUrl(artist: string, title: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title} official audio`)}`;
}

function youtubeFromText(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(YOUTUBE_ID);
  return match ? youtubeWatchUrl(match[1]) : null;
}

function youtubeFromRelations(recording?: MbRecording | null): string | null {
  for (const rel of recording?.relations ?? []) {
    const found = youtubeFromText(rel.url?.resource);
    if (found) return found;
  }
  return null;
}

async function searchYouTubeHtml(query: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((row) => row[1]);
    const first = ids.find((id, index) => ids.indexOf(id) === index);
    return first ? youtubeWatchUrl(first) : null;
  } catch {
    return null;
  }
}

/** Prefer a watch URL; fall back to a YouTube search so the link is never Apple Music. */
export async function resolveYouTubeListenUrl(
  artist: string,
  title: string,
  recording?: MbRecording | null
): Promise<string> {
  const fromMb = youtubeFromRelations(recording);
  if (fromMb) return fromMb;
  const official = await searchYouTubeHtml(`${artist} ${title} official audio`);
  if (official) return official;
  const plain = await searchYouTubeHtml(`${artist} ${title}`);
  if (plain) return plain;
  return youtubeSearchUrl(artist, title);
}

type ITunesSong = {
  artistName?: string;
  trackName?: string;
  collectionName?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
};

type MbArtistCredit = { name?: string; artist?: { name?: string } };
type MbRelation = {
  type?: string;
  attributes?: string[];
  artist?: { name?: string };
  url?: { resource?: string };
};
type MbRecording = {
  id?: string;
  title?: string;
  'first-release-date'?: string;
  'artist-credit'?: MbArtistCredit[];
  relations?: MbRelation[];
  tags?: { name?: string; count?: number }[];
  genres?: { name?: string; count?: number }[];
};

let lastMbAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function norm(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function namesMatch(a: string, b: string) {
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function titleMatch(expected: string, found: string) {
  const left = norm(expected);
  const right = norm(found).replace(/\b(live|remix|remaster(ed)?|edit|version|mono|stereo)\b/g, '').trim();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

async function getJson<T>(url: string, extraHeaders: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...extraHeaders },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function musicBrainz<T>(url: string): Promise<T | null> {
  const wait = MB_GAP_MS - (Date.now() - lastMbAt);
  if (wait > 0) await sleep(wait);
  lastMbAt = Date.now();
  return getJson<T>(url);
}

async function searchITunes(artist: string, title: string): Promise<ITunesSong | null> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const data = await getJson<{ results?: ITunesSong[] }>(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=8`
  );
  const matches = (data?.results ?? []).filter(
    (row) => namesMatch(artist, row.artistName ?? '') && titleMatch(title, row.trackName ?? '')
  );
  const exact = matches.find((row) => norm(row.trackName ?? '') === norm(title));
  const clean = matches.find((row) => !/\b(live|remix|remaster|edit|version)\b/i.test(row.trackName ?? ''));
  return exact ?? clean ?? matches[0] ?? null;
}

async function searchMusicBrainz(artist: string, title: string): Promise<MbRecording | null> {
  const query = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
  const data = await musicBrainz<{ recordings?: MbRecording[] }>(
    `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=5`
  );
  const hit = (data?.recordings ?? []).find((row) => {
    const credit = row['artist-credit']?.[0]?.name ?? row['artist-credit']?.[0]?.artist?.name ?? '';
    return titleMatch(title, row.title ?? '') && namesMatch(artist, credit);
  });
  return hit ?? data?.recordings?.[0] ?? null;
}

async function lookupMusicBrainz(mbid: string): Promise<MbRecording | null> {
  return musicBrainz<MbRecording>(
    `https://musicbrainz.org/ws/2/recording/${mbid}?fmt=json&inc=artist-credits+tags+genres+url-rels+artist-rels+work-rels`
  );
}

function creditsFromRecording(recording: MbRecording): string[] {
  const credits: string[] = [];
  for (const rel of recording.relations ?? []) {
    const who = rel.artist?.name;
    if (rel.type === 'instrument') {
      const inst = (rel.attributes ?? []).join(', ') || 'instrument';
      credits.push(who ? `${inst} (${who})` : inst);
    } else if (rel.type === 'vocal') {
      const kind = (rel.attributes ?? []).join(', ') || 'vocals';
      credits.push(who ? `${kind} (${who})` : kind);
    } else if (rel.type === 'performer' && who) {
      credits.push(`performer (${who})`);
    }
  }
  return unique(credits);
}

function tagsFromRecording(recording: MbRecording): string[] {
  const ranked = [
    ...(recording.genres ?? []).map((g) => ({ name: g.name ?? '', count: g.count ?? 0 })),
    ...(recording.tags ?? []).map((t) => ({ name: t.name ?? '', count: t.count ?? 0 })),
  ]
    .filter((row) => row.name)
    .sort((a, b) => b.count - a.count);
  return unique(ranked.map((row) => row.name)).slice(0, 8);
}

async function wikipediaSummary(artist: string, title: string, recording?: MbRecording | null): Promise<string | null> {
  const wikiUrl = recording?.relations?.find(
    (rel) => rel.type === 'wikipedia' && rel.url?.resource?.includes('wikipedia.org')
  )?.url?.resource;
  const titles: string[] = [];
  if (wikiUrl) {
    try {
      titles.push(decodeURIComponent(new URL(wikiUrl).pathname.replace(/^\/wiki\//, '').replace(/_/g, ' ')));
    } catch {
      /* ignore */
    }
  }
  titles.push(`${title} (${artist} song)`, `${artist} ${title}`, title);

  for (const page of titles) {
    const summary = await getJson<{ extract?: string; type?: string }>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`
    );
    if (summary?.extract && summary.type !== 'disambiguation') {
      return summary.extract.slice(0, 480);
    }
  }

  const search = await getJson<{ query?: { search?: { title?: string }[] } }>(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${artist} ${title}`)}&srlimit=1&format=json`
  );
  const found = search?.query?.search?.[0]?.title;
  if (!found) return null;
  const summary = await getJson<{ extract?: string; type?: string }>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(found)}`
  );
  if (summary?.extract && summary.type !== 'disambiguation') return summary.extract.slice(0, 480);
  return null;
}

export function formatGroundedTrack(track: GroundedTrack): string {
  const lines = [
    `${track.artist}, ${track.title}`,
    track.album ? `Album: ${track.album}` : '',
    track.year ? `Year: ${track.year}` : '',
    track.genre ? `Listed genre: ${track.genre}` : '',
    track.credits.length > 0
      ? `Credits / instrumentation: ${track.credits.join('; ')}`
      : 'Credits: none listed. Do not invent an orchestra, strings, brass, choir, or a full-ensemble build.',
    track.tags.length > 0 ? `Tags: ${track.tags.join(', ')}` : '',
    track.summary ? `Public notes: ${track.summary}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export async function groundReferenceCandidate(
  candidate: ReferenceCandidate
): Promise<GroundedTrack | null> {
  const artist = candidate.artist.trim();
  const title = candidate.title.trim();
  if (!artist || !title) return null;

  const itunes = await searchITunes(artist, title);
  const search = await searchMusicBrainz(artist, title);
  const recording = search?.id ? await lookupMusicBrainz(search.id) : search;

  if (!itunes && !recording) return null;

  const resolvedArtist =
    itunes?.artistName ??
    recording?.['artist-credit']?.[0]?.name ??
    recording?.['artist-credit']?.[0]?.artist?.name ??
    artist;
  const resolvedTitle = itunes?.trackName ?? recording?.title ?? title;
  if (!namesMatch(artist, resolvedArtist) || !titleMatch(title, resolvedTitle)) return null;

  const summary = await wikipediaSummary(resolvedArtist, resolvedTitle, recording);
  const year = itunes?.releaseDate?.slice(0, 4) ?? recording?.['first-release-date']?.slice(0, 4) ?? null;
  const listenUrl = await resolveYouTubeListenUrl(resolvedArtist, resolvedTitle, recording);

  return {
    artist: resolvedArtist,
    title: resolvedTitle.replace(/\s+\((live|remix|remaster(ed)?|edit|version).*?\)$/i, ''),
    album: itunes?.collectionName ?? null,
    year,
    genre: itunes?.primaryGenreName ?? recording?.genres?.[0]?.name ?? null,
    credits: recording ? creditsFromRecording(recording) : [],
    tags: recording ? tagsFromRecording(recording) : [],
    summary,
    listenUrl,
    source: itunes && recording ? 'both' : itunes ? 'itunes' : 'musicbrainz',
  };
}

export async function groundReferenceCandidates(
  candidates: ReferenceCandidate[],
  avoidArtists: string[] = [],
  needed = 2
): Promise<GroundedTrack[]> {
  const avoided = new Set(avoidArtists.map(norm));
  const picked: GroundedTrack[] = [];

  for (const candidate of candidates) {
    if (picked.length >= needed) break;
    if (avoided.has(norm(candidate.artist))) continue;
    if (picked.some((track) => namesMatch(track.artist, candidate.artist))) continue;

    const grounded = await groundReferenceCandidate(candidate);
    if (!grounded) continue;
    if (avoided.has(norm(grounded.artist))) continue;
    if (picked.some((track) => namesMatch(track.artist, grounded.artist))) continue;
    picked.push(grounded);
  }

  return picked;
}

export async function youtubeUrlForReferenceTrack(track: string): Promise<string | null> {
  const parsed = parseReferenceTrack(track);
  if (parsed) return resolveYouTubeListenUrl(parsed.artist, parsed.title);
  const trimmed = track.trim();
  if (!trimmed) return null;
  return resolveYouTubeListenUrl(trimmed, '');
}
