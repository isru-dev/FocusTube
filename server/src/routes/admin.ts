import { Router } from "express";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/requireAuth.ts";
import { requireAdmin } from "../middleware/requireAdmin.ts";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";

const router = Router();
router.use(requireAuth, requireAdmin); // every route in this file is admin-only

const DAY = 24 * 60 * 60 * 1000;
const QUOTA_LIMIT = 10_000; // default YouTube Data API daily quota
const RANGES = [7, 30, 90];

// Wraps a call so the terminal shows which step failed
async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error(`FAILED at step: ${name}`, e);
    throw e;
  }
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

// Supabase returns at most 1000 rows per request, so read in pages
async function fetchAllRows<T>(
  table: string,
  columns: string,
  since?: { column: string; iso: string },
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    let query = supabaseAdmin.from(table).select(columns);
    if (since) query = query.gte(since.column, since.iso);
    const { data, error } = await query.range(from, from + size - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
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

function tally(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// YouTube quota usage from the youtube_api_calls table.
// Returns null if the table isn't set up yet, so the rest of the page still works.
async function getQuota(now: number) {
  try {
    const since = new Date(now - 6 * DAY);
    since.setUTCHours(0, 0, 0, 0);
    const rows = await fetchAllRows<{ units: number; created_at: string }>(
      "youtube_api_calls",
      "units, created_at",
      { column: "created_at", iso: since.toISOString() },
    );

    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) byDay[dayKey(now - i * DAY)] = 0;
    for (const r of rows) {
      const k = r.created_at.slice(0, 10);
      if (k in byDay) byDay[k] += r.units;
    }

    return {
      limit: QUOTA_LIMIT,
      today: byDay[dayKey(now)] ?? 0,
      byDay: Object.entries(byDay).map(([date, units]) => ({ date, units })),
    };
  } catch (e) {
    console.error(
      "quota unavailable (is the youtube_api_calls table created?)",
      e,
    );
    return null;
  }
}

router.get("/stats", async (req, res) => {
  try {
    const requested = Number(req.query.days);
    const days = RANGES.includes(requested) ? requested : 30;

    const allUsers = await step("listUsers", getAllUsers);
    const users = allUsers.filter((u) => u.email_confirmed_at); // confirmed only
    const unconfirmedUsers = allUsers.length - users.length;
    const now = Date.now();

    // Active users: signed in during the last 7 days
    const activeLast7Days = users.filter(
      (u) =>
        u.last_sign_in_at &&
        now - new Date(u.last_sign_in_at).getTime() < 7 * DAY,
    ).length;

    // Signups per day for the selected range, plus the previous period for comparison
    const signupsByDayMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--)
      signupsByDayMap[dayKey(now - i * DAY)] = 0;

    const prevStart = now - 2 * days * DAY;
    const prevEnd = now - days * DAY;
    let signupsPrevTotal = 0;

    for (const u of users) {
      const created = new Date(u.created_at).getTime();
      const k = u.created_at.slice(0, 10);
      if (k in signupsByDayMap) signupsByDayMap[k]++;
      else if (created >= prevStart && created < prevEnd) signupsPrevTotal++;
    }

    // Per-user activity
    const [channelLinks, savedRows, noteRows] = await Promise.all([
      step("read user_channels", () =>
        fetchAllRows<{ user_id: string; channel_id: string }>(
          "user_channels",
          "user_id, channel_id",
        ),
      ),
      step("read saved_videos", () =>
        fetchAllRows<{ user_id: string }>("saved_videos", "user_id"),
      ),
      step("read video_notes", () =>
        fetchAllRows<{ user_id: string }>("video_notes", "user_id"),
      ),
    ]);

    const channelsPerUser = tally(channelLinks.map((l) => l.user_id));
    const savedPerUser = tally(savedRows.map((r) => r.user_id));
    const notesPerUser = tally(noteRows.map((r) => r.user_id));

    // Activation funnel
    const funnel = [
      { label: "Signed up", value: users.length },
      {
        label: "Added a channel",
        value: users.filter((u) => (channelsPerUser[u.id] ?? 0) > 0).length,
      },
      {
        label: "Saved a video",
        value: users.filter((u) => (savedPerUser[u.id] ?? 0) > 0).length,
      },
      {
        label: "Wrote a note",
        value: users.filter((u) => (notesPerUser[u.id] ?? 0) > 0).length,
      },
    ];

    // Users table (newest first, capped)
    const usersTable = users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        channels: channelsPerUser[u.id] ?? 0,
        saved: savedPerUser[u.id] ?? 0,
        notes: notesPerUser[u.id] ?? 0,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200);

    // Most-followed channels
    const channelTally = tally(channelLinks.map((l) => l.channel_id));
    const top = Object.entries(channelTally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const { data: channels, error: channelsError } = await supabaseAdmin
      .from("channels")
      .select("id, name")
      .in(
        "id",
        top.map(([id]) => id),
      );
    if (channelsError) {
      console.error("FAILED at step: channels", channelsError);
      throw channelsError;
    }

    const topChannels = top.map(([id, followers]) => ({
      id,
      title: channels?.find((c) => c.id === id)?.name ?? id,
      followers,
    }));

    const [videos, followLinks, savedVideos, studyPages] = await Promise.all([
      step("count videos", () => countRows("videos")),
      Promise.resolve(channelLinks.length),
      Promise.resolve(savedRows.length),
      Promise.resolve(noteRows.length),
    ]);

    const quota = await getQuota(now);

    res.json({
      range: days,
      totalUsers: users.length,
      activeLast7Days,
      followLinks,
      videos,
      savedVideos,
      studyPages, // the page reads this key
      signupsByDay: Object.entries(signupsByDayMap).map(([date, count]) => ({
        date,
        count,
      })),
      signupsPrevTotal,
      funnel,
      quota,
      users: usersTable,
      topChannels,
    });
  } catch (err) {
    console.error("admin stats error", err);
    res.status(500).json({ error: "Could not load stats" });
  }
});

export default router;
