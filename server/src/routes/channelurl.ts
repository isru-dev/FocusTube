import { Router } from "express";
import type { Request, Response } from 'express';
import { requireAuth } from "../middleware/requireAuth.ts";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";

const router = Router();

function extractHandle(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/youtube\.com\/@([\w.-]+)/);

  if (urlMatch) {
    return urlMatch[1]!;
  }

  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
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
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const handle = extractHandle(url);

  // Resolve handle -> channel info (includes uploads playlist ID)
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${handle}&key=${process.env.YOUTUBE_API_KEY}`
  );
  const channelData = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const channel = channelData.items[0];
  const channelId = channel.id;
  const channelName = channel.snippet.title;
  const thumbnailUrl = channel.snippet.thumbnails.default.url;
  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

  // Save the channel
  const { error: channelError } = await supabaseAdmin
    .from('channels')
    .upsert({ id: channelId, name: channelName, thumbnail_url: thumbnailUrl });

  if (channelError) {
    return res.status(500).json({ error: channelError.message });
  }

  // Link this user to the channel
  const { error: linkError } = await supabaseAdmin
    .from('user_channels')
    .insert({ user_id: req.userId, channel_id: channelId });

  if (linkError && linkError.code !== '23505') {
    return res.status(500).json({ error: linkError.message });
  }

  // Fetch videos from the uploads playlist
  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`
  );
  const videosData = await videosResponse.json();

  const videos = (videosData.items ?? []).map((item: any) => ({
    id: item.snippet.resourceId.videoId,
    channel_id: channelId,
    title: item.snippet.title,
    thumbnail_url: item.snippet.thumbnails.default.url,
    published_at: item.snippet.publishedAt,
  }));

  if (videos.length > 0) {
    const { error: videosError } = await supabaseAdmin
      .from('videos')
      .upsert(videos);

    if (videosError) {
      return res.status(500).json({ error: videosError.message });
    }
  }

  res.status(201).json({ id: channelId, name: channelName, thumbnail_url: thumbnailUrl, videoCount: videos.length });
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
    .select('*')
    .in('channel_id', channelIds)
    .order('published_at', { ascending: false });

  if (videosError) return res.status(500).json({ error: videosError.message });

  const channels = links.map((l: any) => ({
    ...l.channels,
    videos: (videos || []).filter((v: any) => v.channel_id === l.channel_id),
  }));

  res.json(channels);
});

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

export default router;