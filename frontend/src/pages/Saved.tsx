
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { MobileNav } from "../components/MobileNav";
import { SideBar } from "../components/SideBar";
import toast from "react-hot-toast";
import { Trash2, Play, Bookmark } from "lucide-react";

interface SavedVideo {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
}

export function Saved() {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<SavedVideo | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const loadSavedVideos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setVideos([]);
        setError("Please log in to see your saved videos.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("saved_videos")
        .select("id, video_id, title, thumbnail_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setVideos((data ?? []) as SavedVideo[]);
    } catch (err) {
      console.error("Failed to load saved videos:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load saved videos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function savedata(){
        await void loadSavedVideos();
    }
    savedata();
  }, [loadSavedVideos]);

  async function removeSavedVideo(video: SavedVideo) {
    setRemovingId(video.id);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError("Please log in to manage saved videos.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("saved_videos")
        .delete()
        .eq("id", video.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setVideos((current) =>
        current.filter((item) => item.id !== video.id)
      );

      if (playingVideo?.id === video.id) {
        setPlayingVideo(null);
      }

      toast.success("Removed successfully");
    } catch (err) {
      console.error("Failed to remove saved video:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not remove this video."
      );

      toast.error("Could not remove video");
    } finally {
      setRemovingId(null);
    }
  }

  const pageClass = "flex min-h-screen w-full bg-stone-100 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100";

  return (
    <div className={pageClass}>
      <SideBar />
      <MobileNav />

      <main className="min-w-0 w-full p-4 pb-24 sm:p-6 lg:ml-64 lg:w-[calc(100%-16rem)] lg:pb-10 ">
        <div className="mx-auto w-full max-w-6xl ">
          {/* Sticky heading */}
          <header className="sticky top-0 z-20 mb-6 bg-stone-100/95 py-3 backdrop-blur dark:bg-stone-950/95">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500">
              Your library
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Saved videos
              </h1>

              <span className="rounded-full bg-stone-200 px-3 py-1 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                {videos.length}{" "}
                {videos.length === 1 ? "video" : "videos"}
              </span>
            </div>

            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Your bookmarked videos, ready when you are.
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() => void loadSavedVideos()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Video player */}
          {playingVideo && (
            <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 text-sm text-stone-500">
                    Now playing
                  </p>

                  <h2 className="font-semibold">
                    {playingVideo.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="shrink-0 rounded-lg bg-stone-200 px-3 py-2 text-sm hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  Close
                </button>
              </div>

              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  key={playingVideo.video_id}
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${encodeURIComponent(
                    playingVideo.video_id
                  )}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-900"
                >
                  <div className="aspect-video bg-stone-300 dark:bg-stone-800" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-stone-300 dark:bg-stone-800" />
                    <div className="h-8 rounded bg-stone-300 dark:bg-stone-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 && !error ? (
            /* Empty state */
            <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center dark:border-stone-700">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-500" />

              <h2 className="text-xl font-semibold">
                No saved videos yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-stone-600 dark:text-stone-400">
                Visit your Feed and press Save on any video you want
                to watch later. It will appear here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/Feed")}
                className="mt-6 inline-block rounded-lg bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
              >
                Explore your feed
              </button>
            </div>
          ) : (
            /* Saved video cards */
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                >
                  <button
                    type="button"
                    onClick={() => setPlayingVideo(video)}
                    className="group relative block w-full bg-stone-200 text-left dark:bg-stone-800"
                    aria-label={`Play ${video.title}`}
                  >
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        loading="lazy"
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-4xl">
                        ▶
                      </div>
                    )}

                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <Play className="h-12 w-12 fill-white" />
                    </span>
                  </button>

                  <div className="p-4">
                    <h2 className="line-clamp-2 font-semibold">
                      {video.title || "Untitled video"}
                    </h2>

                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                      Saved{" "}
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(video)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        <Play className="h-4 w-4" />
                        Watch
                      </button>

                      <button
                        type="button"
                        onClick={() => void removeSavedVideo(video)}
                        disabled={removingId === video.id}
                        aria-label="Remove saved video"
                        title="Remove saved video"
                        className="flex items-center justify-center rounded-lg border border-stone-300 px-3 py-2 text-sm transition hover:bg-stone-100 disabled:opacity-50 dark:border-stone-700 dark:hover:bg-stone-800"
                      >
                        {removingId === video.id ? (
                          "..."
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
