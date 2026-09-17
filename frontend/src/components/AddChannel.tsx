import { useEffect, useState } from "react";
import { SideBar } from "./sidebar";
import { authFetch } from "../lib/api";
import { MobileNav } from "./MobileNav";

interface Channel {
  id: string;
  name: string;
  thumbnail_url: string;
  url?: string;
}

export function AddChannel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [url, setUrl] = useState("");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);

  const [searching, setSearching] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [followingId, setFollowingId] = useState<string | null>(null);

  const [urlError, setUrlError] = useState("");
  const [urlSuccess, setUrlSuccess] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    loadChannels();
  }, []);
  async function handleRemoveChannel(channelId: string) {
    try {
      const response = await authFetch(
        `http://localhost:5000/youtube/url/${channelId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove channel");
      }

      await loadChannels();
    } catch (error) {
      console.error(error);
    }
  }
  async function loadChannels() {
    try {
      const response = await authFetch(
        "http://localhost:5000/youtube/url/my-channels",
      );

      if (!response.ok) {
        throw new Error("Failed to load channels");
      }

      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError("");

    try {
      const response = await authFetch(
        `http://localhost:5000/youtube/url/search?q=${encodeURIComponent(
          searchQuery.trim(),
        )}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to search channels");
      }

      setSearchResults(data);
    } catch (error) {
      console.error(error);
      setSearchError(
        error instanceof Error
          ? error.message
          : "Failed to search. Please try again.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleFollowChannel(channelUrl: string, channelId: string) {
    if (!channelUrl) return;

    setFollowingId(channelId);
    try {
      const response = await authFetch("http://localhost:5000/youtube/url", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: channelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to follow channel");
      }

      await loadChannels();
    } catch (error) {
      console.error(error);
    } finally {
      setFollowingId(null);
    }
  }

  async function handleUrl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!url.trim()) return;

    setAddingUrl(true);
    setUrlError("");
    setUrlSuccess("");

    try {
      const response = await authFetch("http://localhost:5000/youtube/url", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add channel");
      }

      setUrl("");
      setUrlSuccess("Channel added successfully.");

      await loadChannels();
    } catch (error) {
      setUrlError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setAddingUrl(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      <SideBar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Heading */}
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Add a channel
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
              Follow the channels you actually want to watch.
            </p>
          </header>

          {/* Search */}
          <section>
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search YouTube channels..."
                className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              />

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="h-12 rounded-xl bg-amber-700 px-6 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>
            {searchError && (
              <p className="mt-3 text-sm font-medium text-red-700">
                {searchError}
              </p>
            )}
          </section>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">
                Search results
              </h2>

              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                {searchResults.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-4 border-b border-stone-200 p-4 last:border-0"
                  >
                    <img
                      src={channel.thumbnail_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-stone-900">
                        {channel.name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        YouTube channel
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={followingId === channel.id}
                      onClick={() =>
                        handleFollowChannel(
                          channel.url ||
                            `https://youtube.com/channel/${channel.id}`,
                          channel.id,
                        )
                      }
                      className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-700 hover:text-amber-800 disabled:opacity-50"
                    >
                      {followingId === channel.id ? "Following..." : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              or
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Add by URL */}
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-stone-900">
                Add by URL
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Paste a YouTube channel URL if you already know it.
              </p>
            </div>

            <form
              onSubmit={handleUrl}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/@mkbhd"
                className="h-11 min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              />

              <button
                type="submit"
                disabled={addingUrl || !url.trim()}
                className="h-11 rounded-lg bg-amber-700 px-5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingUrl ? "Adding..." : "Add channel"}
              </button>
            </form>

            {urlSuccess && (
              <p className="mt-3 text-sm font-medium text-green-700">
                {urlSuccess}
              </p>
            )}

            {urlError && (
              <p className="mt-3 text-sm font-medium text-red-700">
                {urlError}
              </p>
            )}
          </section>

          {/* Your Channels */}
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">
              Your channels
            </h2>

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              {channels.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-stone-700">
                    You haven't followed any channels yet.
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    Search for a channel above to get started.
                  </p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-4 border-b border-stone-200 p-4 last:border-0"
                  >
                    <img
                      src={channel.thumbnail_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />

                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">
                      {channel.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemoveChannel(channel.id)}
                      className="shrink-0 px-3 py-2 text-sm font-medium text-stone-500 transition hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
