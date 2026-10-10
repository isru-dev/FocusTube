
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../lib/api";

import { SideBar } from "./sidebar";
import { MobileNav } from "./MobileNav";

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

  useEffect(() => {
    async function loadChannels() {
      try {
        const response = await authFetch(
          "http://localhost:5000/youtube/url/my-channels"
        );

        if (!response.ok) {
          throw new Error("Failed to load channels");
        }

        const data: Channel[] = await response.json();
        setChannels(data);
      } catch (error) {
        console.error("Failed to load channels:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChannels();
  }, []);

  function toggleChannel(channelId: string) {
    setExpandedChannels((current) =>
      current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId]
    );
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const response = await authFetch(
        `http://localhost:5000/youtube/url/videos/search?q=${encodeURIComponent(query)}`
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-stone-100 text-stone-900">
        <SideBar />

        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6">
          <h1 className="mb-6 text-2xl font-bold">Your Feed</h1>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-lg bg-stone-200 p-4"
              >
                <div className="mb-3 aspect-video rounded bg-stone-300" />
                <div className="h-4 w-3/4 rounded bg-stone-300" />
              </div>
            ))}
          </div>
        </main>

        <MobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
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
              className="mb-4 rounded bg-stone-200 px-4 py-2 text-stone-900 transition hover:bg-stone-300"
            >
              ← Back to feed
            </button>

            <h1 className="mb-4 text-xl font-bold">{playingTitle}</h1>

            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                key={playingId}
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0`}
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

              <p className="mt-2 text-stone-600">
                Discover videos from YouTube and your followed creators.
              </p>
            </header>

            <form
              onSubmit={handleSearch}
              className="mb-8 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search all YouTube videos..."
                className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>

              {searchResults.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-lg bg-stone-200 px-4 py-3 text-stone-900 transition hover:bg-stone-300"
                >
                  Clear
                </button>
              )}
            </form>

            {searchError && (
              <p className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                {searchError}
              </p>
            )}

            {searchResults.length > 0 ? (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-semibold">
                  Search results
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handlePlayVideo(video)}
                      className="overflow-hidden rounded-lg bg-white text-left shadow-sm transition hover:bg-stone-200"
                    >
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="aspect-video w-full object-cover"
                      />

                      <div className="p-3">
                        <h3 className="line-clamp-2 font-medium text-stone-900">
                          {video.title}
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : searchQuery.trim() && !searching && !searchError ? (
              <p className="mb-8 text-stone-600">
                No results found. Try another search.
              </p>
            ) : null}

            <section>
              <h2 className="mb-6 text-2xl font-bold">
                Your followed creators
              </h2>

              {channels.length === 0 ? (
                <div className="rounded-lg border border-stone-300 p-8 text-center">
                  <h3 className="mb-2 text-xl font-semibold">
                    Your feed is empty
                  </h3>

                  <p className="mb-5 text-stone-600">
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
                        className="overflow-hidden rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
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
                            <h3 className="font-semibold text-stone-900">
                              {channel.name}
                            </h3>

                            <p className="text-sm text-stone-600">
                              {channel.videos.length} videos
                            </p>
                          </div>

                          <span className="text-sm font-medium text-stone-600">
                            {isExpanded ? "Hide videos ▲" : "Show videos ▼"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-5 border-t border-stone-200 pt-5">
                            {channel.videos.length === 0 ? (
                              <p className="text-stone-600">
                                No videos available for this channel yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {channel.videos.map((video) => (
                                  <button
                                    key={video.id}
                                    type="button"
                                    onClick={() => handlePlayVideo(video)}
                                    className="overflow-hidden rounded-lg bg-stone-100 text-left transition hover:bg-stone-200"
                                  >
                                    <img
                                      src={video.thumbnail_url}
                                      alt={video.title}
                                      className="aspect-video w-full object-cover"
                                    />

                                    <div className="p-3">
                                      <h4 className="line-clamp-2 font-medium text-stone-900">
                                        {video.title}
                                      </h4>
                                    </div>
                                  </button>
                                ))}
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
