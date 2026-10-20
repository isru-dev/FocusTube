import { Router } from 'express';
import type { User } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/requireAuth.ts';
import { requireAdmin } from '../middleware/requireAdmin.ts';
import { supabaseAdmin } from '../lib/supabaseAdmin.ts';

const router = Router();
router.use(requireAuth, requireAdmin); // every route in this file is admin-only

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true }); // head: true = count only, no rows
  if (error) throw error;
  return count ?? 0;
}

async function getAllUsers(): Promise<User[]> {
  const all: User[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return all;
}

router.get('/stats', async (_req, res) => {
  try {
    const users = await getAllUsers();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // Active users: signed in during the last 7 days
    const activeLast7Days = users.filter(
      (u) => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < 7 * DAY
    ).length;

    // Signups per day for the last 30 days (days with no signups count as 0)
    const signupsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      signupsByDay[new Date(now - i * DAY).toISOString().slice(0, 10)] = 0;
    }
    for (const u of users) {
      const day = u.created_at.slice(0, 10);
      if (day in signupsByDay) signupsByDay[day]++;
    }

    // Most-followed channels
    const { data: links, error: linksError } = await supabaseAdmin
      .from('user_channels')
      .select('channel_id');
    if (linksError) throw linksError;

    const tally: Record<string, number> = {};
    for (const l of links ?? []) tally[l.channel_id] = (tally[l.channel_id] ?? 0) + 1;
    const top = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const { data: channels } = await supabaseAdmin
      .from('channels')
      .select('id, title') // change "title" if your column has another name
      .in('id', top.map(([id]) => id));

    const topChannels = top.map(([id, followers]) => ({
      id,
      title: channels?.find((c) => c.id === id)?.title ?? id,
      followers,
    }));

    const [followLinks, videos, savedVideos, studyPages] = await Promise.all([
      countRows('user_channels'),
      countRows('videos'),
      countRows('saved_videos'),
      countRows('study_pages'), // change to your study/notes table name
    ]);

    res.json({
      totalUsers: users.length,
      activeLast7Days,
      followLinks,
      videos,
      savedVideos,
      studyPages,
      signupsByDay: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      topChannels,
    });
  } catch (err) {
    console.error('admin stats error', err);
    res.status(500).json({ error: 'Could not load stats' });
  }
});

export default router;