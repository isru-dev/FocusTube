export interface StudyNote {
  id: string;
  user_id: string;
  video_id: string | null;
  video_title: string | null;
  video_url: string | null;
  title: string;
  content: string; // plain-text copy, used for search
  content_json: unknown[] | null; // BlockNote blocks
  created_at: string;
  updated_at: string;
}

export interface NoteTimestamp {
  id: string;
  note_id: string;
  seconds: number;
  label: string;
}

export interface NotePatch {
  title: string;
  content: string;
  content_json: unknown[];
}

export interface VideoRef {
  id: string;
  title: string;
}

export interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
}

export const NOTE_COLUMNS =
  "id, user_id, video_id, video_title, video_url, title, content, content_json, created_at, updated_at";

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return h ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

export const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";

export const primaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50";