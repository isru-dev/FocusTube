
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import YouTube, { type YouTubeProps } from "react-youtube";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";

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

export function Study() {
  const [searchParams] = useSearchParams();

  const videoId = searchParams.get("videoId") ?? "";
  const videoTitle = searchParams.get("title") ?? "Untitled video";

  const [userId, setUserId] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteTitle, setNoteTitle] = useState("My study notes");
  const [content, setContent] = useState("");
  const [timestamps, setTimestamps] = useState<NoteTimestamp[]>([]);
  const [timestampLabel, setTimestampLabel] = useState("");
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) {
        toast.error("The video player is not ready yet.");
        return;
      }

      player.seekTo(seconds, true);
      player.playVideo();
    },
    [player],
  );

  const loadNotes = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Please sign in to use Study Notes.");
      setLoading(false);
      return;
    }

    setUserId(user.id);

    if (!videoId) {
      setLoading(false);
      return;
    }

    const { data: note, error: noteError } = await supabase
      .from("video_notes")
      .select("id, title, content")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (noteError) {
      console.error(noteError);
      toast.error("Could not load your notes.");
      setLoading(false);
      return;
    }

    if (note) {
      setNoteId(note.id);
      setNoteTitle(note.title);
      setContent(note.content);

      const { data: savedTimestamps, error: timestampError } =
        await supabase
          .from("note_timestamps")
          .select("id, seconds, label")
          .eq("note_id", note.id)
          .eq("user_id", user.id)
          .order("seconds", { ascending: true });

      if (timestampError) {
        console.error(timestampError);
        toast.error("Could not load timestamps.");
      } else {
        setTimestamps(savedTimestamps ?? []);
      }
    } else {
      setNoteId("");
      setNoteTitle("My study notes");
      setContent("");
      setTimestamps([]);
    }

    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const saveNotes = async () => {
    if (!userId || !videoId) {
      toast.error("Sign in and open a video before saving.");
      return;
    }

    setSaving(true);

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

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Notes could not be saved. Please try again.");
      return;
    }

    setNoteId(data.id);
    toast.success("Study notes saved.");
  };

  const addTimestamp = async () => {
    if (!player) {
      toast.error("Wait for the video player to load.");
      return;
    }

    if (!userId || !videoId) {
      toast.error("Sign in and open a video first.");
      return;
    }

    let currentNoteId = noteId;

    if (!currentNoteId) {
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

      if (error) {
        console.error(error);
        toast.error("Save your notes before adding a timestamp.");
        return;
      }

      currentNoteId = data.id;
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

    if (error) {
      console.error(error);
      toast.error("Could not save the timestamp.");
      return;
    }

    setTimestamps((previous) =>
      [...previous, data].sort((a, b) => a.seconds - b.seconds),
    );
    setTimestampLabel("");
    toast.success(`Timestamp ${formatTime(seconds)} added.`);
  };

  const deleteTimestamp = async (timestampId: string) => {
    const { error } = await supabase
      .from("note_timestamps")
      .delete()
      .eq("id", timestampId)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      toast.error("Could not delete timestamp.");
      return;
    }

    setTimestamps((previous) =>
      previous.filter((item) => item.id !== timestampId),
    );
    toast.success("Timestamp deleted.");
  };

  const playerOptions: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      rel: 0,
    },
  };

  // Make timestamps such as 02:35 in your notes clickable.
  const renderNoteContent = () => {
    const parts = content.split(/(\b\d{1,2}:\d{2}\b)/g);

    return parts.map((part, index) => {
      if (/^\d{1,2}:\d{2}$/.test(part)) {
        const [minutes, seconds] = part.split(":").map(Number);

        if (seconds < 60) {
          return (
            <button
              key={`${part}-${index}`}
              type="button"
              onClick={() => seekTo(minutes * 60 + seconds)}
              className="mx-1 inline font-semibold text-blue-600 underline dark:text-blue-400"
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
      <main className="min-h-screen bg-stone-50 p-6 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <h1 className="mb-3 text-2xl font-bold">Study Page</h1>
        <p className="mb-4">
          Open a video from your Feed to start taking notes.
        </p>
        <Link
          to="/Feed"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Feed
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              FocusTube · Study
            </p>
            <h1 className="mt-1 text-2xl font-bold">Study Page</h1>
          </div>

          <Link
            to="/Feed"
            className="rounded-lg bg-stone-200 px-4 py-2 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
          >
            ← Back to Feed
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section className="min-w-0">
            <h2 className="mb-3 text-lg font-semibold">{videoTitle}</h2>

            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <YouTube
                videoId={videoId}
                opts={playerOptions}
                onReady={(event) => setPlayer(event.target)}
                onError={() =>
                  toast.error(
                    "YouTube could not play this video. Check the video ID or its embedding settings.",
                  )
                }
                className="h-full w-full"
                iframeClassName="h-full w-full"
              />
            </div>

            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <h3 className="mb-3 font-semibold">Video timestamps</h3>

              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={timestampLabel}
                  onChange={(event) => setTimestampLabel(event.target.value)}
                  placeholder="What should you remember here?"
                  className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
                  maxLength={200}
                />

                <button
                  type="button"
                  onClick={() => void addTimestamp()}
                  disabled={!player || loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add current time
                </button>
              </div>

              {timestamps.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Play the video and add a timestamp when you reach an
                  important moment.
                </p>
              ) : (
                <ul className="space-y-2">
                  {timestamps.map((timestamp) => (
                    <li
                      key={timestamp.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-stone-100 p-3 dark:bg-stone-800"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => seekTo(timestamp.seconds)}
                          className="font-semibold text-blue-600 underline dark:text-blue-400"
                        >
                          {formatTime(timestamp.seconds)}
                        </button>
                        <p className="break-words text-sm">
                          {timestamp.label || "Important moment"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void deleteTimestamp(timestamp.id)}
                        className="shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-stone-700"
                        aria-label={`Delete timestamp at ${formatTime(timestamp.seconds)}`}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 md:p-6">
            <h2 className="mb-1 text-xl font-semibold">My study notes</h2>
            <p className="mb-5 text-sm text-stone-500 dark:text-stone-400">
              Notes are saved separately for each video in your account.
            </p>

            {loading ? (
              <p>Loading your notes...</p>
            ) : (
              <>
                <label
                  htmlFor="study-note-title"
                  className="mb-2 block text-sm font-medium"
                >
                  Note title
                </label>
                <input
                  id="study-note-title"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  maxLength={150}
                  className="mb-4 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-stone-700"
                  placeholder="My study notes"
                />

                <label
                  htmlFor="study-note-content"
                  className="mb-2 block text-sm font-medium"
                >
                  Your notes
                </label>
                <textarea
                  id="study-note-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={16}
                  placeholder={"Write your notes here...\n\nExample:\n02:35 — Key idea"}
                  className="w-full resize-y rounded-lg border border-stone-300 bg-transparent p-3 leading-7 dark:border-stone-700"
                />

                <button
                  type="button"
                  onClick={() => void saveNotes()}
                  disabled={saving}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save notes"}
                </button>

                <div className="mt-6 border-t border-stone-200 pt-4 dark:border-stone-800">
                  <h3 className="mb-2 font-semibold">Preview</h3>
                  <div className="whitespace-pre-wrap break-words leading-7">
                    {content ? (
                      renderNoteContent()
                    ) : (
                      <span className="text-stone-500">
                        Your note preview will appear here.
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    Tip: write timestamps like 02:35 in your notes. Click
                    them in the preview to jump to that part of the video.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
