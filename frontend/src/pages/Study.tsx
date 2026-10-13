import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import YouTube, { type YouTubeProps } from "react-youtube";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  FilePlus2,
  PlayCircle,
  Target,
} from "lucide-react";

import { FocusBar } from "./study/FocusBar";
import { KeyMoments } from "./study/KeyMoments";
import { NoteEditor } from "./study/NoteEditor";
import { PlayerControls } from "./study/PlayerControls";
import { clearPosition, readPosition, savePosition } from "./study/position";
import { StudySidebar } from "./study/StudySidebar";
import { useStudyNotes } from "./study/Usestudynotes";
import {
  primaryClass,
  SEEK_EVENT,
  secondaryClass,
  type StudyNote,
  type VideoRef,
  type YouTubePlayer,
} from "./study/Types";

function latestUpdated(notes: StudyNote[]): StudyNote | undefined {
  return notes.reduce<StudyNote | undefined>(
    (best, note) =>
      !best || new Date(note.updated_at) > new Date(best.updated_at)
        ? note
        : best,
    undefined,
  );
}

export function Study() {
  const [searchParams] = useSearchParams();
  const urlVideoId = (searchParams.get("videoId") ?? "").trim() || null;
  const urlTitle = searchParams.get("title") ?? "Untitled video";

  const { userId, notes, loading, createNote, updateNote, deleteNote } =
    useStudyNotes();

  const [activeNoteId, setActiveNoteId] = useState("");
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [playerError, setPlayerError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [focus, setFocus] = useState(false);

  // Pick a starting note once notes have loaded (and again if the URL
  // points at a different video): the newest page for that video, or the
  // most recently edited note when no video is in the URL.
  const pickedFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const key = urlVideoId ?? "";
    if (pickedFor.current === key) return;
    pickedFor.current = key;

    const candidates = urlVideoId
      ? notes.filter((note) => note.video_id === urlVideoId)
      : notes;

    setActiveNoteId(latestUpdated(candidates)?.id ?? "");
  }, [loading, urlVideoId, notes]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  // The video always follows the open note, so the notes, the key moments
  // and the player can never be out of sync. With no note open yet, fall
  // back to the video from the URL.
  const playerVideoId = activeNote ? activeNote.video_id : urlVideoId;
  const contextVideo: VideoRef | null = playerVideoId
    ? { id: playerVideoId, title: activeNote?.video_title ?? urlTitle }
    : null;

  // Where you stopped last time. Read once per video, so saving progress
  // while watching never restarts the player.
  const startAt = useMemo(
    () => (playerVideoId ? readPosition(playerVideoId) : 0),
    [playerVideoId],
  );

  const playerOptions = useMemo<YouTubeProps["opts"]>(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 0, rel: 0, start: startAt },
    }),
    [startAt],
  );

  // A new video means a fresh player.
  useEffect(() => {
    setPlayer(null);
    setPlayerError("");
  }, [playerVideoId]);

  // Remember the position every few seconds and when the tab closes.
  useEffect(() => {
    if (!player || !playerVideoId) return;

    const activePlayer = player;
    const videoId = playerVideoId;

    function save() {
      try {
        const time = activePlayer.getCurrentTime();
        const duration = activePlayer.getDuration();

        if (typeof time !== "number" || time < 5) return;

        // Finished (or nearly): next time starts from the beginning.
        if (duration > 0 && duration - time < 10) clearPosition(videoId);
        else savePosition(videoId, time);
      } catch {
        // The player may already be torn down; nothing to save then.
      }
    }

    const id = setInterval(save, 5000);
    window.addEventListener("pagehide", save);

    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [player, playerVideoId]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) {
        toast.error("Wait for the video player to load.");
        return;
      }

      player.seekTo(seconds, true);
      player.playVideo();
    },
    [player],
  );

  // Timestamp chips inside notes ask us to seek through this event.
  useEffect(() => {
    function onSeek(event: Event) {
      seekTo((event as CustomEvent<number>).detail);
    }

    window.addEventListener(SEEK_EVENT, onSeek);
    return () => window.removeEventListener(SEEK_EVENT, onSeek);
  }, [seekTo]);

  async function handleCreate(video: VideoRef | null) {
    setCreating(true);
    const created = await createNote(video);
    setCreating(false);

    if (created) {
      setActiveNoteId(created.id);
      toast.success("Page created.");
    }
  }

  async function handleDelete() {
    if (!activeNote) return;

    if (
      !window.confirm(
        "Delete this page and its saved timestamps? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    const ok = await deleteNote(activeNote.id);
    setDeleting(false);

    if (!ok) return;

    const remaining = notes.filter((note) => note.id !== activeNote.id);
    const sameVideo = remaining.filter(
      (note) => note.video_id === activeNote.video_id,
    );

    setActiveNoteId((sameVideo[0] ?? remaining[0])?.id ?? "");
    toast.success("Page deleted.");
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-3 py-5 text-zinc-100 sm:px-5 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1600px]">
        {focus ? (
          <FocusBar player={player} onExit={() => setFocus(false)} />
        ) : (
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-300">
                  FocusTube
                </p>
                <h1 className="text-xl font-bold sm:text-2xl">
                  Your notes workspace
                </h1>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFocus(true)}
                className={primaryClass}
                title="Hide everything except the video and your note, with a study timer"
              >
                <Target size={16} /> Focus mode
              </button>

              <Link to="/Feed" className={secondaryClass}>
                <ArrowLeft size={16} /> Back to Feed
              </Link>
            </div>
          </header>
        )}

        <div
          className={`grid grid-cols-1 gap-5 ${
            focus ? "" : "lg:grid-cols-[260px_minmax(0,1fr)]"
          }`}
        >
          {!focus && (
            <StudySidebar
              notes={notes}
              activeNoteId={activeNoteId}
              currentVideo={contextVideo}
              creating={creating}
              onSelect={(note) => setActiveNoteId(note.id)}
              onCreate={(video) => void handleCreate(video)}
            />
          )}

          <section className="min-w-0">
            {loading ? (
              <p className="flex min-h-72 items-center justify-center text-zinc-500">
                Loading workspace…
              </p>
            ) : (
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                {/* Video column: stays in view while you write */}
                <div
                  className={`min-w-0 space-y-5 xl:sticky ${
                    focus ? "xl:top-24" : "xl:top-5"
                  }`}
                >
                  <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                      <PlayCircle className="text-sky-300" size={18} />
                      <h2 className="min-w-0 flex-1 truncate font-semibold">
                        {contextVideo?.title ?? "Video lesson"}
                      </h2>
                    </div>

                    {playerVideoId ? (
                      <div className="aspect-video bg-black">
                        <YouTube
                          key={playerVideoId}
                          videoId={playerVideoId}
                          opts={playerOptions}
                          onReady={(event) => {
                            setPlayer(event.target as YouTubePlayer);
                            setPlayerError("");
                          }}
                          onError={(event) => {
                            console.error("YouTube player error:", event.data);
                            setPlayerError(
                              "This video may not allow embedded playback.",
                            );
                          }}
                          className="h-full w-full"
                          iframeClassName="h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-zinc-950 p-6 text-center">
                        <PlayCircle size={32} className="text-zinc-600" />
                        <p className="text-sm text-zinc-400">
                          This page isn’t linked to a video
                        </p>
                        <Link
                          to="/Feed"
                          className="text-sm text-sky-300 underline"
                        >
                          Choose a video from your Feed
                        </Link>
                      </div>
                    )}

                    {playerVideoId && (
                      <PlayerControls player={player} resumedFrom={startAt} />
                    )}

                    {playerError && playerVideoId && (
                      <div className="p-3 text-sm text-amber-200">
                        {playerError}{" "}
                        <a
                          href={`https://www.youtube.com/watch?v=${encodeURIComponent(playerVideoId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          Open on YouTube
                        </a>
                      </div>
                    )}
                  </section>

                  {activeNote && playerVideoId && (
                    <KeyMoments
                      noteId={activeNote.id}
                      userId={userId}
                      player={player}
                      onSeek={seekTo}
                    />
                  )}
                </div>

                {/* Editor column */}
                <div className="min-w-0">
                  {activeNote ? (
                    <NoteEditor
                      key={activeNote.id}
                      note={activeNote}
                      player={player}
                      deleting={deleting}
                      onSave={updateNote}
                      onDelete={() => void handleDelete()}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center">
                      <p className="font-medium">
                        {contextVideo
                          ? "No pages for this video yet"
                          : "Choose a page to edit"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {contextVideo
                          ? "Create a page and start taking notes while you watch."
                          : "Or create a new one."}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCreate(contextVideo)}
                        disabled={creating || !userId}
                        className={`${primaryClass} mt-4`}
                      >
                        <FilePlus2 size={16} />
                        {creating ? "Creating…" : "New page"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Study;
