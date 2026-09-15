import { useEffect, useState } from "react";
import { authFetch } from "../lib/api";
import { SideBar } from "./sidebar";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      try {
        const response = await authFetch(
          "http://localhost:5000/youtube/url/my-channels"
        );

        if (!response.ok) {
          throw new Error("Failed to load channels");
        }

        const data = await response.json();
        setChannels(data);
      } catch (error) {
        console.error("Failed to load channels:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChannels();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-stone-100">
        <SideBar />

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-8">
              <div className="h-7 w-32 rounded bg-stone-200" />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="space-y-3">
                    <div className="aspect-video rounded-xl bg-stone-200" />
                    <div className="h-4 w-3/4 rounded bg-stone-200" />
                    <div className="h-4 w-1/2 rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      <SideBar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Page Header */}
          <header className="mb-8">
            <p className="text-sm font-medium text-amber-700">
              Your feed
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
              Latest from your channels
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Only videos from channels you follow.
            </p>
          </header>

          {/* Player */}
          {playingId && (
            <section className="mb-10">
              <div className="overflow-hidden rounded-2xl bg-stone-900 shadow-sm">
                <div className="aspect-video w-full max-w-4xl">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${playingId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {channels.length === 0 && (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <p className="text-lg font-semibold text-stone-900">
                Your feed is empty.
              </p>

              <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                Follow a few channels to start building a feed that belongs
                to you.
              </p>

              <a
                href="/AddChannel"
                className="mt-6 rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
              >
                Add a channel
              </a>
            </div>
          )}

          {/* Channels */}
          <div className="space-y-12">
            {channels.map((channel) => (
              <section key={channel.id}>

                {/* Channel heading */}
                <div className="mb-4 flex items-center gap-3">
                  {channel.thumbnail_url && (
                    <img
                      src={channel.thumbnail_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  )}

                  <h2 className="text-lg font-semibold text-stone-900">
                    {channel.name}
                  </h2>
                </div>

                {/* Videos */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {channel.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setPlayingId(video.id)}
                      className="group min-w-0 text-left"
                    >
                      <div className="overflow-hidden rounded-xl bg-stone-200">
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      </div>

                      <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-5 text-stone-900 group-hover:text-amber-800">
                        {video.title}
                      </h3>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}