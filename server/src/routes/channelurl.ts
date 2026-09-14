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

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const handle = extractHandle(url);

  // 1. Resolve handle -> channel info (includes uploads playlist ID)
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

  // 2. Save the channel (shared table, upsert as before)
  const { error: channelError } = await supabaseAdmin
    .from('channels')
    .upsert({ id: channelId, name: channelName, thumbnail_url: thumbnailUrl });

  if (channelError) {
    return res.status(500).json({ error: channelError.message });
  }

  // 3. Link this user to the channel
  const { error: linkError } = await supabaseAdmin
    .from('user_channels')
    .insert({ user_id: req.userId, channel_id: channelId });

  if (linkError && linkError.code !== '23505') {
    // ignore "already added" conflicts here; only fail on real errors
    return res.status(500).json({ error: linkError.message });
  }

  // 4. Fetch videos from the uploads playlist
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


router.get('/my-channels', requireAuth, async (req: Request, res: Response) => {
  const { data: links, error: linksError } = await supabaseAdmin
    .from('user_channels')
    .select('channel_id, channels(id, name, thumbnail_url)')
    .eq('user_id', req.userId);

  if (linksError) return res.status(500).json({ error: linksError.message });

  const channelIds = links.map((l: any) => l.channel_id);

  const { data: videos, error: videosError } = await supabaseAdmin
    .from('videos')
    .select('*')
    .in('channel_id', channelIds)
    .order('published_at', { ascending: false });

  if (videosError) return res.status(500).json({ error: videosError.message });

  const channels = links.map((l: any) => ({
    ...l.channels,
    videos: videos.filter((v: any) => v.channel_id === l.channel_id),
  }));

  res.json(channels);
});

export default router;