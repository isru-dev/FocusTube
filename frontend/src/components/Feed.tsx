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
      const response = await authFetch("http://localhost:5000/youtube/url/my-channels");
      const data = await response.json();
      setChannels(data);
      setLoading(false);
    }
    loadChannels();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <SideBar />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {playingId && (
          <div className="aspect-video w-full max-w-3xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${playingId}`}
              allowFullScreen
            />
          </div>
        )}

        {channels.map((channel) => (
          <div key={channel.id}>
            <h2 className="text-lg font-semibold mb-2">{channel.name}</h2>
            <div className="flex gap-4 overflow-x-auto">
              {channel.videos.map((video) => (
                <button key={video.id} onClick={() => setPlayingId(video.id)} className="w-48 shrink-0 text-left">
                  <img src={video.thumbnail_url} className="rounded w-full" />
                  <p className="text-sm mt-1 line-clamp-2">{video.title}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}