
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import { SideBar } from "./sidebar";
import { MobileNav } from "./MobileNav";
import toast from "react-hot-toast";
import { Save } from 'lucide-react';
import { BookmarkCheck } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
}

interface Channel {
  id: string;
  name: string;
  thumbnail_url: string;
  videos: Video[];
}

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function Feed() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [expandedChannels, setExpandedChannels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const [savingVideoIds, setSavingVideoIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const loadSavedVideos = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setSavedVideoIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("saved_videos")
        .select("video_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setSavedVideoIds((data ?? []).map((item) => item.video_id));
    } catch (error) {
      console.error("Failed to load saved videos:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadChannels() {
      try {
        const response = await authFetch(
          `${API_URL}/youtube/url/my-channels`
        );

        if (!response.ok) {
          throw new Error("Failed to load channels");
        }

        const data: Channel[] = await response.json();

        if (active) {
          setChannels(data);
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadChannels();
    void loadSavedVideos();

    return () => {
      active = false;
    };
  }, [loadSavedVideos]);

  function toggleChannel(channelId: string) {
    setExpandedChannels((current) =>
      current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId]
    );
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const response = await authFetch(
        `${API_URL}/youtube/url/videos/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Video search failed. Please try again.");
      }

      const data = await response.json();
      setSearchResults(data.videos ?? data);
    } catch (error) {
      console.error("Video search failed:", error);
      setSearchError(
        "Could not search videos. Check your backend and try again."
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
  }

  function handlePlayVideo(video: Video) {
    setPlayingId(video.id);
    setPlayingTitle(video.title);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function toggleSavedVideo(video: Video) {
    if (savingVideoIds.includes(video.id)) return;

    setSavingVideoIds((current) => [...current, video.id]);
    setSaveError("");
    setSaveMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setSaveError("Please log in to save videos.");
        return;
      }

      const isSaved = savedVideoIds.includes(video.id);

      if (isSaved) {
        const { error } = await supabase
          .from("saved_videos")
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", video.id);

        if (error) throw error;

        setSavedVideoIds((current) =>
          current.filter((id) => id !== video.id)
        );
        setSaveMessage("Video removed from your saved videos.");
      } else {
        const { error } = await supabase
          .from("saved_videos")
          .insert({
            user_id: user.id,
            video_id: video.id,
            title: video.title,
            thumbnail_url: video.thumbnail_url || null,
          });

        if (error) {
          // Handle a duplicate gracefully in case another request
          // already saved this video.
          if (error.code === "23505") {
            await loadSavedVideos();
          } else {
            throw error;
          }
        } else {
          setSavedVideoIds((current) =>
            current.includes(video.id)
              ? current
              : [...current, video.id]
          );
        }

        setSaveMessage("Video saved successfully.");
        toast.success("Video saved successfully")
      }
    } catch (error) {
      console.error("Could not update saved video:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not update the saved video. Please try again."
      );
    } finally {
      setSavingVideoIds((current) =>
        current.filter((id) => id !== video.id)
      );
    }
  }

  function renderVideoCard(video: Video) {
    const isSaved = savedVideoIds.includes(video.id);
    const isSaving = savingVideoIds.includes(video.id);

    return (
      <article
        key={video.id}
        className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
      >
        <button
          type="button"
          onClick={() => handlePlayVideo(video)}
          className="block w-full text-left"
        >
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        </button>

        <div className="flex items-start gap-3 p-3">
          <button
            type="button"
            onClick={() => handlePlayVideo(video)}
            className="min-w-0 flex-1 text-left"
          >
            <h3 className="line-clamp-2 font-medium text-stone-900 dark:text-stone-100">
              {video.title}
            </h3>
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
              Watch video ▶
            </p>
          </button>

          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? "Unsave video" : "Save video"}
            title={isSaved ? "Remove from saved videos" : "Save for later"}
            disabled={isSaving}
            onClick={() => void toggleSavedVideo(video)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-50 ${
              isSaved
                ? "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                : "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            }`}
          >
            {isSaving ? "..." : isSaved ? <BookmarkCheck /> : <Save />}
          </button>
        </div>
      </article>
    );
  }

  const pageClass =
    "flex min-h-screen bg-stone-100 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100";

  if (loading) {
    return (
      <div className={pageClass}>
        <SideBar />

        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6">
          <h1 className="mb-6 text-2xl font-bold">Your Feed</h1>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-lg bg-stone-200 p-4 dark:bg-stone-800"
              >
                <div className="mb-3 aspect-video rounded bg-stone-300 dark:bg-stone-700" />
                <div className="h-4 w-3/4 rounded bg-stone-300 dark:bg-stone-700" />
              </div>
            ))}
          </div>
        </main>

        <MobileNav />
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <SideBar />

      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6">
        {playingId ? (
          <section className="mb-8">
            <button
              type="button"
              onClick={() => {
                setPlayingId(null);
                setPlayingTitle("");
              }}
              className="mb-4 rounded-lg bg-stone-200 px-4 py-2 transition hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
            >
              ← Back to feed
            </button>

            <h1 className="mb-4 text-xl font-bold">{playingTitle}</h1>

            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                key={playingId}
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${encodeURIComponent(playingId)}?autoplay=1&rel=0`}
                title={playingTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        ) : (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold">Your Feed</h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Discover videos from YouTube and your followed creators.
              </p>
            </header>

            {saveError && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {saveError}
              </p>
            )}

            {saveMessage && (
              <p
                role="status"
                className="mb-4 rounded-lg bg-amber-100 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
              >
                {saveMessage}
              </p>
            )}

            <form
              onSubmit={handleSearch}
              className="mb-8 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search all YouTube videos..."
                className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:ring-red-900"
              />

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>

              {(searchResults.length > 0 || searchError) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-lg bg-stone-200 px-4 py-3 transition hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  Clear
                </button>
              )}
            </form>

            {searchError && (
              <p className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
                {searchError}
              </p>
            )}

            {searching && (
              <p className="mb-6 text-stone-600 dark:text-stone-400">
                Searching YouTube...
              </p>
            )}

            {searchResults.length > 0 ? (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-semibold">
                  Search results
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((video) => renderVideoCard(video))}
                </div>
              </section>
            ) : searchQuery.trim() && !searching && !searchError ? (
              <p className="mb-8 text-stone-600 dark:text-stone-400">
                No results found. Try another search.
              </p>
            ) : null}

            <section>
              <h2 className="mb-6 text-2xl font-bold">
                Your followed creators
              </h2>

              {channels.length === 0 ? (
                <div className="rounded-lg border border-stone-300 p-8 text-center dark:border-stone-700 dark:bg-stone-900">
                  <h3 className="mb-2 text-xl font-semibold">
                    Your feed is empty
                  </h3>

                  <p className="mb-5 text-stone-600 dark:text-stone-400">
                    Follow some YouTube channels to see their videos here.
                  </p>

                  <Link
                    to="/AddChannel"
                    className="inline-block rounded-lg bg-red-600 px-5 py-2 font-medium text-white transition hover:bg-red-700"
                  >
                    Find channels
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {channels.map((channel) => {
                    const isExpanded = expandedChannels.includes(channel.id);

                    return (
                      <section
                        key={channel.id}
                        className="overflow-hidden rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChannel(channel.id)}
                          aria-expanded={isExpanded}
                          className="flex w-full items-center gap-3 rounded-lg text-left"
                        >
                          <img
                            src={channel.thumbnail_url}
                            alt={channel.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold">
                              {channel.name}
                            </h3>
                            <p className="text-sm text-stone-600 dark:text-stone-400">
                              {channel.videos.length} videos
                            </p>
                          </div>

                          <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                            {isExpanded ? "Hide videos ▲" : "Show videos ▼"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-5 border-t border-stone-200 pt-5 dark:border-stone-800">
                            {channel.videos.length === 0 ? (
                              <p className="text-stone-600 dark:text-stone-400">
                                No videos available for this channel yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {channel.videos.map((video) =>
                                  renderVideoCard(video)
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
