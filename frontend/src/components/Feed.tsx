
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
          <h1 className="mb-6 text-2xl font-bold">
            Your Feed
          </h1>

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

            <h1 className="mb-4 text-xl font-bold">
              {playingTitle}
            </h1>

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
              <h1 className="text-3xl font-bold">
                Your Feed
              </h1>

              <p className="mt-2 text-stone-600">
                Videos from the channels you follow.
              </p>
            </header>

            {channels.length === 0 ? (
              <div className="rounded-lg border border-stone-300 p-8 text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  Your feed is empty
                </h2>

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
              <div className="space-y-10">
                {channels.map((channel) => (
                  <section key={channel.id}>
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={channel.thumbnail_url}
                        alt={channel.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />

                      <h2 className="text-xl font-semibold">
                        {channel.name}
                      </h2>
                    </div>

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
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
