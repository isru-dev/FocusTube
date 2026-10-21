import { Router } from "express";
import type { Request, Response } from 'express';
import { requireAuth } from "../middleware/requireAuth.ts";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import { logYoutubeCall, QUOTA_COST } from '../lib/Youtubequota.ts';
const router = Router();


function extractChannelIdentifier(input: string): {
  type: "handle" | "id";
  value: string;
} {
  const trimmed = input.trim();

  // Accept a direct channel ID, such as UCxxxxxxxx
  if (/^UC[\w-]+$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  // Accept a YouTube channel URL
  const channelIdMatch = trimmed.match(
    /youtube\.com\/channel\/(UC[\w-]+)/
  );

  if (channelIdMatch) {
    return { type: "id", value: channelIdMatch[1]! };
  }

  // Accept a YouTube handle URL
  const handleMatch = trimmed.match(
    /youtube\.com\/@([\w.-]+)/
  );

  if (handleMatch) {
    return { type: "handle", value: handleMatch[1]! };
  }

  // Accept a bare handle, such as @SomeCreator
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1) };
  }

  // Accept a bare handle, such as SomeCreator
  return { type: "handle", value: trimmed };
}


// 1. SEARCH channels by name using YouTube API
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        query.trim()
      )}&key=${process.env.YOUTUBE_API_KEY}`
    );
    
logYoutubeCall('search.channels', QUOTA_COST.search);   
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      return res.status(500).json({ error: searchData.error?.message || 'YouTube search failed' });
    }

    const channels = (searchData.items ?? []).map((item: any) => ({
      id: item.snippet.channelId,
      name: item.snippet.title,
      thumbnail_url: item.snippet.thumbnails.default.url,
      url: `https://youtube.com/channel/${item.snippet.channelId}`,
    }));

    res.json(channels);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// 2. POST add channel via URL

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const identifier = extractChannelIdentifier(url);

    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      key: process.env.YOUTUBE_API_KEY!,
    });

    if (identifier.type === "id") {
      params.set("id", identifier.value);
    } else {
      params.set("forHandle", identifier.value);
    }

    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
    );
     logYoutubeCall('channels.list', QUOTA_COST.list);   // add
    const channelData = await channelResponse.json();

    if (!channelResponse.ok) {
      console.error("YouTube channel lookup failed:", channelData);

      return res.status(502).json({
        error:
          channelData.error?.message ??
          "YouTube channel lookup failed",
      });
    }

    if (!channelData.items || channelData.items.length === 0) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    // Prefer the highest-resolution channel thumbnail available.
    const thumbnailUrl =
      channel.snippet.thumbnails?.high?.url ||
      channel.snippet.thumbnails?.medium?.url ||
      channel.snippet.thumbnails?.default?.url ||
      "";

    const uploadsPlaylistId =
      channel.contentDetails.relatedPlaylists.uploads;

    // Save the channel.
    const { error: channelError } = await supabaseAdmin
      .from("channels")
      .upsert({
        id: channelId,
        name: channelName,
        thumbnail_url: thumbnailUrl,
      });

    if (channelError) {
      return res.status(500).json({ error: channelError.message });
    }

    // Link this user to the channel.
    const { error: linkError } = await supabaseAdmin
      .from("user_channels")
      .insert({
        user_id: req.userId,
        channel_id: channelId,
      });

    if (linkError && linkError.code !== "23505") {
      return res.status(500).json({ error: linkError.message });
    }

    // Fetch videos from the uploads playlist.
    const videosParams = new URLSearchParams({
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: "10",
      key: process.env.YOUTUBE_API_KEY!,
    });

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${videosParams.toString()}`
    );
logYoutubeCall('playlistItems.list', QUOTA_COST.list);   // add
    const videosData = await videosResponse.json();

    if (!videosResponse.ok) {
      console.error("YouTube video lookup failed:", videosData);

      return res.status(502).json({
        error:
          videosData.error?.message ??
          "YouTube video lookup failed",
      });
    }

    const videos = (videosData.items ?? [])
      .filter((item: any) => item.snippet?.resourceId?.videoId)
      .map((item: any) => {
        const thumbnails = item.snippet.thumbnails ?? {};

        // Prefer high-resolution video thumbnails.
        const videoThumbnail =
          thumbnails.maxres?.url ||
          thumbnails.standard?.url ||
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          thumbnails.default?.url ||
          "";

        return {
          id: item.snippet.resourceId.videoId,
          channel_id: channelId,
          title: item.snippet.title,
          thumbnail_url: videoThumbnail,
          published_at: item.snippet.publishedAt,
        };
      });

    if (videos.length > 0) {
      const { error: videosError } = await supabaseAdmin
        .from("videos")
        .upsert(videos);

      if (videosError) {
        return res.status(500).json({ error: videosError.message });
      }
    }

    return res.status(201).json({
      id: channelId,
      name: channelName,
      thumbnail_url: thumbnailUrl,
      videoCount: videos.length,
    });
  } catch (error) {
    console.error("Error adding YouTube channel:", error);

    return res.status(500).json({
      error: "An unexpected error occurred while adding the channel",
    });
  }
});

// 3. GET my-channels feed
router.get('/my-channels', requireAuth, async (req: Request, res: Response) => {
  const { data: links, error: linksError } = await supabaseAdmin
    .from('user_channels')
    .select('channel_id, channels(id, name, thumbnail_url)')
    .eq('user_id', req.userId);

  if (linksError) return res.status(500).json({ error: linksError.message });

  const channelIds = links.map((l: any) => l.channel_id);

  if (channelIds.length === 0) {
    return res.json([]);
  }

  const { data: videos, error: videosError } = await supabaseAdmin
    .from('videos')
    .select('id, title, thumbnail_url, channel_id, published_at')
    .in('channel_id', channelIds)
    .order('published_at', { ascending: false });

  if (videosError) return res.status(500).json({ error: videosError.message });

  const videosByChannel = new Map<string, any[]>();
  for (const video of videos ?? []) {
    const channelVideos = videosByChannel.get(video.channel_id) ?? [];
    channelVideos.push(video);
    videosByChannel.set(video.channel_id, channelVideos);
  }

  const channels = links.map((l: any) => ({
    ...l.channels,
    videos: videosByChannel.get(l.channel_id) ?? [],
  }));

  res.json(channels);
});

router.get(
  "/:channelId/videos",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const pageToken = String(req.query.pageToken ?? "").trim();
      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error: "YouTube API is not configured",
        });
      }

      // Make sure this user follows this channel.
      const { data: link, error: linkError } = await supabaseAdmin
        .from("user_channels")
        .select("channel_id")
        .eq("user_id", req.userId)
        .eq("channel_id", channelId)
        .maybeSingle();

      if (linkError) {
        return res.status(500).json({ error: linkError.message });
      }

      if (!link) {
        return res.status(404).json({
          error: "Followed channel not found",
        });
      }

      // Find the creator's uploads playlist.
      const channelParams = new URLSearchParams({
        part: "contentDetails",
        id: channelId,
        key: apiKey,
      });

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?${channelParams}`
      );
      logYoutubeCall('channels.list', QUOTA_COST.list);   // add
      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        return res.status(502).json({
          error: channelData.error?.message ?? "Could not find channel",
        });
      }

      const uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.status(404).json({
          error: "Could not find this creator's uploads",
        });
      }

      // On the first request, skip the initial 10 videos already in the feed.
      let tokenToUse = pageToken;

      if (!tokenToUse) {
        const firstPageParams = new URLSearchParams({
          part: "snippet",
          playlistId: uploadsPlaylistId,
          maxResults: "10",
          key: apiKey,
        });

        const firstPageResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?${firstPageParams}`
        );
   logYoutubeCall('playlistItems.list', QUOTA_COST.list);   // add
        const firstPageData = await firstPageResponse.json();

        if (!firstPageResponse.ok) {
          return res.status(502).json({
            error:
              firstPageData.error?.message ??
              "Could not load creator videos",
          });
        }

        tokenToUse = firstPageData.nextPageToken ?? "";
      }

      if (!tokenToUse) {
        return res.json({
          videos: [],
          nextPageToken: null,
        });
      }

      // Fetch the next 10 videos.
      const videosParams = new URLSearchParams({
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults: "10",
        pageToken: tokenToUse,
        key: apiKey,
      });

      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${videosParams}`
      );
   logYoutubeCall('playlistItems.list', QUOTA_COST.list);   // add
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        return res.status(502).json({
          error:
            videosData.error?.message ??
            "Could not load more creator videos",
        });
      }

      const videos = (videosData.items ?? [])
        .filter((item: any) => item.snippet?.resourceId?.videoId)
        .map((item: any) => {
          const snippet = item.snippet;
          const thumbnails = snippet.thumbnails ?? {};

          return {
            id: snippet.resourceId.videoId,
            channel_id: channelId,
            title: snippet.title ?? "Untitled video",
            thumbnail_url:
              thumbnails.maxres?.url ??
              thumbnails.standard?.url ??
              thumbnails.high?.url ??
              thumbnails.medium?.url ??
              thumbnails.default?.url ??
              "",
            published_at: snippet.publishedAt ?? null,
          };
        });

      if (videos.length > 0) {
        const { error: saveError } = await supabaseAdmin
          .from("videos")
          .upsert(videos);

        if (saveError) {
          return res.status(500).json({
            error: saveError.message,
          });
        }
      }

      return res.json({
        videos,
        nextPageToken: videosData.nextPageToken ?? null,
      });
    } catch (error) {
      console.error("Load more creator videos failed:", error);

      return res.status(500).json({
        error: "Could not load more creator videos",
      });
    }
  }
);

// 4. DELETE remove channel link for user
router.delete('/:channelId', requireAuth, async (req: Request, res: Response) => {
  const { channelId } = req.params;

  const { error } = await supabaseAdmin
    .from('user_channels')
    .delete()
    .eq('user_id', req.userId)
    .eq('channel_id', channelId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});


router.get(
  "/videos/search",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q ?? "").trim();

      if (!query) {
        return res.status(400).json({
          error: "Search query is required",
        });
      }

      if (query.length > 200) {
        return res.status(400).json({
          error: "Search query must be 200 characters or fewer",
        });
      }

      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        console.error("YOUTUBE_API_KEY is not configured");

        return res.status(500).json({
          error: "YouTube API is not configured",
        });
      }

      
const pageToken = String(req.query.pageToken ?? "").trim();

const params = new URLSearchParams({
  part: "snippet",
  type: "video",
  q: query,
  maxResults: "20",
  order: "relevance",
  key: apiKey,
});

if (pageToken) {
  params.set("pageToken", pageToken);
}


      const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
      );
     logYoutubeCall('search.videos', QUOTA_COST.search);   // add
      const youtubeData = await youtubeResponse.json();

      if (!youtubeResponse.ok) {
        console.error("YouTube video search failed:", youtubeData);

        return res.status(502).json({
          error:
            youtubeData.error?.message ??
            "YouTube video search failed",
        });
      }

      const videos = (youtubeData.items ?? [])
        .filter((item: any) => item.id?.videoId)
        .map((item: any) => {
          const thumbnails = item.snippet?.thumbnails ?? {};

          return {
            id: item.id.videoId,
            title: item.snippet?.title ?? "Untitled video",
            thumbnail_url:
              thumbnails.high?.url ??
              thumbnails.medium?.url ??
              thumbnails.default?.url ??
              "",
            channel_id: item.snippet?.channelId ?? "",
            channel_name: item.snippet?.channelTitle ?? "",
            published_at: item.snippet?.publishedAt ?? null,
          };
        });

      return res.status(200).json({
        videos,
        nextPageToken: youtubeData.nextPageToken ?? null,
        resultsCount: videos.length,
      });
    } catch (error) {
      console.error("Error searching YouTube videos:", error);

      return res.status(500).json({
        error: "An unexpected error occurred while searching videos",
      });
    }
  })

  
export default router;
