import { useEffect, useState } from "react";

import { authFetch } from "../lib/api";
import { supabase } from "../lib/supabaseClient";

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
  const [playingTitle, setPlayingTitle] = useState<string>("");
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

    async function setupRealtime() {
      await loadChannels();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user.id;

      if (!userId) {
        console.error("No authenticated user found");
        return;
      }

      const realtimeChannel = supabase
        .channel(`feed-${userId}`)

        // New videos
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "videos",
          },
          () => {
            console.log("New video detected");
            loadChannels();
          }
        )

        // Video updates
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "videos",
          },
          () => {
            loadChannels();
          }
        )

        // Channel added/removed
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_channels",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            console.log("Channel list changed");
            loadChannels();
          }
        )

        .subscribe((status) => {
          console.log("Feed realtime:", status);
        });

      return realtimeChannel;
    }

    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    setupRealtime().then((channel) => {
      realtimeChannel = channel;
    });

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const handlePlayVideo = (video: Video) => {
    setPlayingId(video.id);
    setPlayingTitle(video.title);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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

          {playingId ? (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setPlayingId(null);
                  setPlayingTitle("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 shadow-xs transition hover:bg-stone-200/60 hover:text-stone-900"
              >
                ← Back to feed
              </button>

              <div className="overflow-hidden rounded-2xl bg-stone-900 shadow-lg">
                <div className="aspect-video w-full">
                  <iframe
                    className="h-full w-full border-0"
                    src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0`}
                    title={playingTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                  {playingTitle}
                </h1>

                <p className="mt-2 text-sm text-stone-500">
                  Playing distraction-free from your subscribed channels.
                </p>
              </div>
            </div>
          ) : (
            <>
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

              <div className="space-y-12">
                {channels.map((channel) => (
                  <section key={channel.id}>
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

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                      {channel.videos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => handlePlayVideo(video)}
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
            </>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}