import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import YouTube, { type YouTubeProps } from "react-youtube";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  FileText,
  LoaderCircle,
  PlayCircle,
  Save,
  Trash2,
} from "lucide-react";

interface VideoNote {
  id: string;
  title: string;
  content: string;
}

interface NoteTimestamp {
  id: string;
  seconds: number;
  label: string;
}

interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
}

const inputClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3.5 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50";

export function Study() {
  const [searchParams] = useSearchParams();
  const videoId = (searchParams.get("videoId") ?? "").trim();
  const videoTitle = searchParams.get("title") ?? "Untitled video";

  const [userId, setUserId] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteTitle, setNoteTitle] = useState("My study notes");
  const [content, setContent] = useState("");
  const [timestamps, setTimestamps] = useState<NoteTimestamp[]>([]);
  const [timestampLabel, setTimestampLabel] = useState("");
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingTimestamp, setAddingTimestamp] = useState(false);
  const [deletingTimestampId, setDeletingTimestampId] = useState("");
  const [playerError, setPlayerError] = useState("");

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) {
        toast.error("Wait for the video player to finish loading.");
        return;
      }
      player.seekTo(seconds, true);
      player.playVideo();
    },
    [player],
  );

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setUserId("");
        setNoteId("");
        setTimestamps([]);
        toast.error("Please sign in to use Study Notes.");
        return;
      }

      setUserId(user.id);
      if (!videoId) return;

      const { data: note, error: noteError } = await supabase
        .from("video_notes")
        .select("id, title, content")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

      if (noteError) throw noteError;

      if (note) {
        const savedNote = note as VideoNote;
        setNoteId(savedNote.id);
        setNoteTitle(savedNote.title || "My study notes");
        setContent(savedNote.content || "");

        const { data: savedTimestamps, error: timestampError } = await supabase
          .from("note_timestamps")
          .select("id, seconds, label")
          .eq("note_id", savedNote.id)
          .eq("user_id", user.id)
          .order("seconds", { ascending: true });

        if (timestampError) throw timestampError;
        setTimestamps((savedTimestamps ?? []) as NoteTimestamp[]);
      } else {
        setNoteId("");
        setNoteTitle("My study notes");
        setContent("");
        setTimestamps([]);
      }
    } catch (error) {
      console.error("Failed to load study notes:", error);
      toast.error(
        error instanceof Error ? `Could not load notes: ${error.message}` : "Could not load your notes.",
      );
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const saveNotes = async () => {
    if (!userId || !videoId) {
      toast.error("Sign in and open a video before saving notes.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("video_notes")
        .upsert(
          {
            user_id: userId,
            video_id: videoId,
            video_title: videoTitle,
            video_url: `https://www.youtube.com/watch?v=${videoId}`,
            title: noteTitle.trim() || "My study notes",
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,video_id" },
        )
        .select("id")
        .single();

      if (error) throw error;
      setNoteId(data.id);
      toast.success("Study notes saved.");
    } catch (error) {
      console.error("Failed to save study notes:", error);
      toast.error(
        error instanceof Error ? `Could not save notes: ${error.message}` : "Could not save your notes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addTimestamp = async () => {
    if (!player) {
      toast.error("Wait for the video player to finish loading.");
      return;
    }
    if (!userId || !videoId) {
      toast.error("Sign in and open a video before adding a timestamp.");
      return;
    }

    setAddingTimestamp(true);
    try {
      let currentNoteId = noteId;
      if (!currentNoteId) {
        const { data: note, error: noteError } = await supabase
          .from("video_notes")
          .upsert(
            {
              user_id: userId,
              video_id: videoId,
              video_title: videoTitle,
              video_url: `https://www.youtube.com/watch?v=${videoId}`,
              title: noteTitle.trim() || "My study notes",
              content,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,video_id" },
          )
          .select("id")
          .single();

        if (noteError) throw noteError;
        currentNoteId = note.id;
        setNoteId(currentNoteId);
      }

      const seconds = Math.floor(player.getCurrentTime());
      const { data, error } = await supabase
        .from("note_timestamps")
        .insert({
          note_id: currentNoteId,
          user_id: userId,
          seconds,
          label: timestampLabel.trim(),
        })
        .select("id, seconds, label")
        .single();

      if (error) throw error;
      setTimestamps((current) =>
        [...current, data as NoteTimestamp].sort((a, b) => a.seconds - b.seconds),
      );
      setTimestampLabel("");
      toast.success(`Timestamp ${formatTime(seconds)} added.`);
    } catch (error) {
      console.error("Failed to add timestamp:", error);
      toast.error(
        error instanceof Error ? `Could not add timestamp: ${error.message}` : "Could not save the timestamp.",
      );
    } finally {
      setAddingTimestamp(false);
    }
  };

  const deleteTimestamp = async (timestampId: string) => {
    if (!userId) return;
    setDeletingTimestampId(timestampId);
    try {
      const { error } = await supabase
        .from("note_timestamps")
        .delete()
        .eq("id", timestampId)
        .eq("user_id", userId);

      if (error) throw error;
      setTimestamps((current) => current.filter((item) => item.id !== timestampId));
      toast.success("Timestamp deleted.");
    } catch (error) {
      console.error("Failed to delete timestamp:", error);
      toast.error("Could not delete timestamp.");
    } finally {
      setDeletingTimestampId("");
    }
  };

  const playerOptions: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: { autoplay: 0, rel: 0 },
  };

  const renderNotePreview = () => {
    const parts = content.split(/(\b\d{1,2}:\d{2}(?::\d{2})?\b)/g);
    return parts.map((part, index) => {
      if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(part)) {
        const values = part.split(":").map(Number);
        const seconds = values.length === 3
          ? values[0] * 3600 + values[1] * 60 + values[2]
          : values[0] * 60 + values[1];
        if (values[values.length - 1] < 60 && (values.length === 2 || values[1] < 60)) {
          return (
            <button
              key={`${part}-${index}`}
              type="button"
              onClick={() => seekTo(seconds)}
              className="mx-0.5 rounded-md bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-300 underline decoration-sky-500/50 underline-offset-2 hover:bg-sky-500/20"
              title={`Jump to ${part}`}
            >
              {part}
            </button>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!videoId) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-bold">Your study workspace</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Open a video from your Feed to take notes, save key moments, and jump back to important parts.</p>
          <Link to="/Feed" className={`${primaryButtonClassName} mt-6`}>
            <ArrowLeft size={16} /> Go to Feed
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-3 py-5 text-zinc-100 sm:px-5 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">FocusTube · Study mode</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Study workspace</h1>
            </div>
          </div>
          <Link to="/Feed" className={secondaryButtonClassName}>
            <ArrowLeft size={16} /> Back to Feed
          </Link>
        </header>

        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 sm:px-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Currently studying</p>
          <h2 className="break-words text-base font-semibold leading-6 text-zinc-100 sm:text-lg">{videoTitle}</h2>
          <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Your notes and timestamps are saved to your account for this video.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/10">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5">
                <PlayCircle size={18} className="text-sky-300" />
                <h3 className="font-semibold">Video lesson</h3>
                <span className="ml-auto text-xs text-zinc-500">Watch and take notes</span>
              </div>
              <div className="aspect-video bg-black">
                <YouTube
                  videoId={videoId}
                  opts={playerOptions}
                  onReady={(event) => {
                    setPlayer(event.target as YouTubePlayer);
                    setPlayerError("");
                  }}
                  onError={(event) => {
                    console.error("YouTube player error:", event.data);
                    setPlayerError("YouTube couldn't embed this video. Check that the video is public and embedding is allowed.");
                    toast.error("YouTube could not play this video. Check its availability and embedding settings.");
                  }}
                  className="h-full w-full"
                  iframeClassName="h-full w-full"
                />
              </div>
              {playerError && (
                <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
                  {playerError} <a className="ml-1 underline underline-offset-2" href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer">Open on YouTube</a>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-violet-400/10 p-2 text-violet-300"><Clock3 size={19} /></div>
                  <div>
                    <h3 className="font-semibold">Key moments</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">Save a point in the video to revisit later.</p>
                  </div>
                </div>
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{timestamps.length} saved</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={timestampLabel}
                  onChange={(event) => setTimestampLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addTimestamp();
                    }
                  }}
                  maxLength={200}
                  placeholder="Label this moment (optional)"
                  className={`${inputClassName} min-w-0 flex-1`}
                />
                <button type="button" onClick={() => void addTimestamp()} disabled={!player || loading || addingTimestamp} className={primaryButtonClassName}>
                  {addingTimestamp ? <LoaderCircle size={16} className="animate-spin" /> : <Clock3 size={16} />}
                  Add current time
                </button>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="flex items-center gap-2 py-5 text-sm text-zinc-500"><LoaderCircle size={16} className="animate-spin" /> Loading timestamps…</div>
                ) : timestamps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
                    <Clock3 className="mx-auto mb-2 text-zinc-600" size={22} />
                    <p className="text-sm font-medium text-zinc-300">No key moments yet</p>
                    <p className="mt-1 text-xs text-zinc-500">Play the video, then add a timestamp when you reach something important.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {timestamps.map((timestamp) => (
                      <li key={timestamp.id} className="group flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-zinc-700">
                        <button type="button" onClick={() => seekTo(timestamp.seconds)} className="shrink-0 rounded-lg bg-sky-500/10 px-3 py-2 font-mono text-sm font-bold tabular-nums text-sky-300 transition hover:bg-sky-500/20" title={`Jump to ${formatTime(timestamp.seconds)}`}>
                          {formatTime(timestamp.seconds)}
                        </button>
                        <p className="min-w-0 flex-1 break-words text-sm text-zinc-300">{timestamp.label || "Important moment"}</p>
                        <button type="button" onClick={() => void deleteTimestamp(timestamp.id)} disabled={deletingTimestampId === timestamp.id} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50" aria-label={`Delete timestamp at ${formatTime(timestamp.seconds)}`} title="Delete timestamp">
                          {deletingTimestampId === timestamp.id ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/10">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5 sm:px-5">
                <div className="rounded-lg bg-emerald-400/10 p-1.5 text-emerald-300"><FileText size={17} /></div>
                <div>
                  <h3 className="font-semibold">Study notes</h3>
                  <p className="text-xs text-zinc-500">Write down ideas as you watch.</p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500"><span className={`h-1.5 w-1.5 rounded-full ${saving ? "bg-amber-400" : "bg-emerald-400"}`} />{saving ? "Saving…" : "Manual save"}</span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                {loading ? (
                  <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-500"><LoaderCircle size={17} className="animate-spin" /> Loading your notes…</div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="study-note-title" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Note title</label>
                      <input id="study-note-title" value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} maxLength={150} className={inputClassName} placeholder="e.g. Main ideas from this lesson" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label htmlFor="study-note-content" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your notes</label>
                        <span className="text-xs tabular-nums text-zinc-600">{content.length} characters</span>
                      </div>
                      <textarea
                        id="study-note-content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={15}
                        placeholder={"Capture the main ideas here…\n\nExample:\n02:35 — The key concept is…\n05:10 — Remember this example…"}
                        className={`${inputClassName} min-h-[300px] resize-y leading-7 sm:min-h-[380px]`}
                      />
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Tip: write a timestamp such as <span className="font-mono text-sky-300">02:35</span> in your notes. It becomes clickable in the preview below.</p>
                    </div>
                    <button type="button" onClick={() => void saveNotes()} disabled={saving} className={`${primaryButtonClassName} w-full py-3`}>
                      {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                      {saving ? "Saving your notes…" : "Save study notes"}
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-sky-400/10 p-1.5 text-sky-300"><BookOpen size={17} /></div>
                <div>
                  <h3 className="font-semibold">Notes preview</h3>
                  <p className="text-xs text-zinc-500">Click any highlighted timestamp to jump in the video.</p>
                </div>
              </div>
              <div className="min-h-24 whitespace-pre-wrap break-words rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-7 text-zinc-300">
                {loading ? (
                  <span className="text-zinc-600">Preparing your preview…</span>
                ) : content.trim() ? (
                  renderNotePreview()
                ) : (
                  <span className="text-zinc-600">Your notes will appear here as you write them.</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500"><Check size={14} className="text-emerald-400" /> Remember to save your notes before leaving this page.</div>
            </section>
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
          <span>FocusTube Study Mode</span>
          <span>Watch · Capture · Review</span>
        </footer>
      </div>
    </main>
  );
}

export default Study;
