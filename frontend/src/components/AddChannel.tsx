import { useState } from "react";
import { SideBar } from "./sidebar";
import { authFetch } from "../lib/api";

export function AddChannel() {
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [urlSuccess, setUrlSuccess] = useState("");

  const [searchLoading, setSearchLoading] = useState(false);

  async function handleUrl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!url.trim()) {
      setUrlError("Please enter a YouTube channel URL.");
      return;
    }

    setUrlLoading(true);
    setUrlError("");
    setUrlSuccess("");

    try {
      const response = await authFetch(
        "http://localhost:5000/youtube/url",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add channel");
      }

      setUrlSuccess("Channel added successfully.");
      setUrl("");
    } catch (error) {
      setUrlError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);

    try {
      // TODO: connect this to your channel search endpoint
      console.log("Searching channel by name:", searchQuery.trim());
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      <SideBar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page heading */}
          <header className="mb-8">
            <p className="text-sm font-medium text-amber-700">
              Your channels
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
              Add a channel
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
              Follow channels you actually want to watch. They’re the only
              channels that will appear in your feed.
            </p>
          </header>

          <div className="space-y-6">
            {/* Search by name */}
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-stone-900">
                  Find a channel
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Search for a channel by name.
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="channel-search" className="sr-only">
                  Channel name
                </label>

                <input
                  id="channel-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. MKBHD"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                />

                <button
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="min-h-11 rounded-lg bg-amber-700 px-5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Search results will go here */}
              {/* 
                Example:
                <div className="mt-5 border-t border-stone-200 pt-5">
                  ...
                </div>
              */}
            </section>

            {/* Add by URL */}
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-stone-900">
                  Add by URL
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Already know the channel? Paste its YouTube URL.
                </p>
              </div>

              <form
                onSubmit={handleUrl}
                className="flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor="channel-url"
                    className="mb-1.5 block text-sm font-medium text-stone-700"
                  >
                    YouTube channel URL
                  </label>

                  <input
                    id="channel-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/@mkbhd"
                    className="min-h-11 w-full rounded-lg border border-stone-300 bg-stone-50 px-3.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={urlLoading || !url.trim()}
                  className="min-h-11 self-start rounded-lg bg-amber-700 px-5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {urlLoading ? "Adding..." : "Add channel"}
                </button>
              </form>

              {urlSuccess && (
                <p className="mt-4 text-sm font-medium text-green-700">
                  {urlSuccess}
                </p>
              )}

              {urlError && (
                <p className="mt-4 text-sm font-medium text-red-700">
                  {urlError}
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}