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

  const ytResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${handle}&key=${process.env.YOUTUBE_API_KEY}`
  );
  if (!ytResponse.ok) {
  const error = await ytResponse.text();
  console.error("YouTube API error:", error);
  return res.status(502).json({ error: "YouTube API request failed" });
}
  const ytData = await ytResponse.json();

  if (!ytData.items || ytData.items.length === 0) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const channel = ytData.items[0];
  const channelId = channel.id;
  const channelName = channel.snippet.title;
  const thumbnailUrl = channel.snippet.thumbnails.default.url;

  const { error: channelError } = await supabaseAdmin
    .from('channels')
    .upsert({ id: channelId, name: channelName, thumbnail_url: thumbnailUrl });

  if (channelError) {
    return res.status(500).json({ error: channelError.message });
  }

  const { error: linkError } = await supabaseAdmin
    .from('user_channels')
    .insert({ user_id: req.userId, channel_id: channelId });

  if (linkError) {
    if (linkError.code === '23505') {
      return res.status(409).json({ error: 'You already added this channel' });
    }
    return res.status(500).json({ error: linkError.message });
  }

  res.status(201).json({ id: channelId, name: channelName, thumbnail_url: thumbnailUrl });
});

export const channelurl = router;