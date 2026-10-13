import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import YouTube, { type YouTubeProps } from "react-youtube";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, FilePlus2, PlayCircle } from "lucide-react";

import { KeyMoments } from "./study/Keymoments";
import { NoteEditor } from "./study/Noteeditor";
import { StudySidebar } from "./study/Studysidebar";
import { useStudyNotes } from "./study/Usestudynotes ";
import {
  primaryClass,
  secondaryClass,
  type StudyNote,
  type VideoRef,
  type YouTubePlayer,
} from "./study/Types";

const playerOptions: YouTubeProps["opts"] = {
  width: "100%",
  height: "100%",
  playerVars: { autoplay: 0, rel: 0 },
};

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
  const attachNoteId = (searchParams.get("attachNote") ?? "").trim();

  const { userId, notes, loading, createNote, updateNote, attachVideo, deleteNote } =
    useStudyNotes();

  const [activeNoteId, setActiveNoteId] = useState("");
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [playerError, setPlayerError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pick a starting note once notes have loaded (and again if the URL
  // points at a different video): the newest page for that video, or the
  // most recently edited note when no video is in the URL.
  const pickedFor = useRef<string | null>(null);
  const attachedFor = useRef<string | null>(null);

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

  useEffect(() => {
    if (loading || !urlVideoId || !attachNoteId) return;

    const key = `${attachNoteId}:${urlVideoId}`;
    if (attachedFor.current === key) return;

    const note = notes.find((item) => item.id === attachNoteId);
    if (!note) return;

    attachedFor.current = key;
    void attachVideo(attachNoteId, { id: urlVideoId, title: urlTitle }).then(
      (attached) => {
        if (attached) {
          setActiveNoteId(attachNoteId);
          toast.success("Video attached to your note.");
        }
      },
    );
  }, [attachNoteId, attachVideo, loading, notes, urlTitle, urlVideoId]);

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

  // A new video means a fresh player.
  useEffect(() => {
    setPlayer(null);
    setPlayerError("");
  }, [playerVideoId]);

  function seekTo(seconds: number) {
    if (!player) {
      toast.error("Wait for the video player to load.");
      return;
    }

    player.seekTo(seconds, true);
    player.playVideo();
  }

  async function handleCreate(video: VideoRef | null) {
    if (loading || !userId || creating) {
      if (!userId && !loading) toast.error("Please sign in to create notes.");
      return;
    }

    setCreating(true);
    let created: StudyNote | null = null;
    try {
      created = await createNote(video);
    } finally {
      setCreating(false);
    }

    if (created) setActiveNoteId(created.id);
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

          <Link to="/Feed" className={secondaryClass}>
            <ArrowLeft size={16} /> Back to Feed
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <StudySidebar
            notes={notes}
            activeNoteId={activeNoteId}
            creating={creating || loading}
            canCreate={!!userId}
            onSelect={(note) => setActiveNoteId(note.id)}
            onCreate={(video) => void handleCreate(video)}
          />

          <section className="min-w-0">
            {loading ? (
              <p className="flex min-h-72 items-center justify-center text-zinc-500">
                Loading workspace…
              </p>
            ) : (
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                {/* Video column: stays in view while you write */}
                <div className="min-w-0 space-y-5 xl:sticky xl:top-5">
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
                          to={`/Feed?attachNote=${encodeURIComponent(activeNote?.id ?? "")}`}
                          className="text-sm text-sky-300 underline"
                        >
                          Choose a video to attach
                        </Link>
                      </div>
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
                      deleting={deleting}
                      onSave={updateNote}
                      onDelete={() => void handleDelete()}
                      getCurrentTime={() => {
                        if (!player) {
                          toast.error("Wait for the video player to load.");
                          return null;
                        }
                        return Math.floor(player.getCurrentTime());
                      }}
                      onSeek={seekTo}
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
