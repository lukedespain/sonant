/**
 * Audio uploads go from the browser straight to Supabase Storage using a signed
 * URL. They cannot go through a route handler: Netlify caps request bodies at
 * 6 MB base64, which is roughly 4.5 MB of audio, and rejects anything larger at
 * the edge with an empty body before our code runs.
 *
 * 50 MB is the Supabase project-wide storage cap, and both buckets enforce it,
 * so the copy shown to composers and the checks here track the same number.
 */
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_AUDIO_LABEL = '50 MB';

export const SUBMISSION_BUCKET = 'competition-tracks';
export const COMMUNITY_BUCKET = 'community-tracks';

export type AudioKind = 'mp3' | 'wav';

const CONTENT_TYPE: Record<AudioKind, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

export function detectAudioKind(fileName: string, contentType?: string | null): AudioKind | null {
  const name = fileName.toLowerCase();
  const type = (contentType ?? '').toLowerCase();
  if (name.endsWith('.mp3') || type === 'audio/mpeg' || type === 'audio/mp3') return 'mp3';
  if (
    name.endsWith('.wav') ||
    type === 'audio/wav' ||
    type === 'audio/wave' ||
    type === 'audio/x-wav'
  ) {
    return 'wav';
  }
  return null;
}

export function isMp3(fileName: string, contentType?: string | null) {
  return detectAudioKind(fileName, contentType) === 'mp3';
}

/** Buckets reject the mime types they are not configured for, so send a known one. */
export function contentTypeFor(kind: AudioKind) {
  return CONTENT_TYPE[kind];
}

/** Reduce a display name to something safe to use as a storage key segment. */
export function toStorageStem(name: string, fallback = 'track') {
  const stem = name
    .replace(/\.(mp3|wav)$/i, '')
    .replace(/[^\w\s.-]+/g, '')
    .replace(/\s+/g, ' ')
    // "Intro... Outro" is an ordinary track title, but a run of dots would put
    // ".." in the key, which the confirm step refuses. Truncating first would
    // also strand a trailing dot next to the extension.
    .replace(/\.{2,}/g, '.')
    .slice(0, 120)
    .replace(/^[.\s]+|[.\s]+$/g, '');
  return stem || fallback;
}

/**
 * Playlist objects are keyed `<briefId>/<userId>/<random>.mp3`. The uploader's
 * id is in the key so that confirming an upload can require the caller to be
 * the composer the signed URL was issued to. The bucket is public and anyone
 * holding the anon key can list a brief's folder, so without that segment an
 * abandoned object could be claimed by whoever saw it first.
 */
export function communityPrefix(briefId: string, userId: string) {
  return `${briefId}/${userId}`;
}

export function communityStoragePath(briefId: string, userId: string) {
  const objectName = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
  return `${communityPrefix(briefId, userId)}/${objectName}`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function tooLargeMessage(bytes: number, format: 'MP3 or WAV' | 'MP3') {
  const hint =
    format === 'MP3'
      ? 'Try a 320 kbps bounce.'
      : 'Try a 320 kbps MP3, or a 16-bit WAV.';
  return `That file is ${formatBytes(bytes)}. Uploads need to be under ${MAX_AUDIO_LABEL}. ${hint}`;
}
