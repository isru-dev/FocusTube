import { supabaseAdmin } from './supabaseAdmin.ts';

// YouTube Data API quota costs (units per call)
export const QUOTA_COST = {
  list: 1, // channels.list, playlistItems.list, videos.list
  search: 100, // search.list
} as const;

// Records one YouTube API call. Fire-and-forget: it never throws,
// so a logging problem can never break a real request.
export function logYoutubeCall(endpoint: string, units: number): void {
  supabaseAdmin
    .from('youtube_api_calls')
    .insert({ endpoint, units })
    .then(({ error }) => {
      if (error) console.error('could not log youtube call', error.message);
    });
}