export function youtubeSearchUrlForTrack(track: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(track.trim())}`;
}
