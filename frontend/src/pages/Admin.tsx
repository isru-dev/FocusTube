import { useEffect, useState } from "react";
import { authFetch } from "../lib/api";

type Stats = {
  totalUsers: number;
  activeLast7Days: number;
  followLinks: number;
  videos: number;
  savedVideos: number;
  studyPages: number;
  signupsByDay: { date: string; count: number }[];
  topChannels: { id: string; title: string; followers: number }[];
};

export function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // adjust to how you call authFetch elsewhere (full URL or path)
        const res = await authFetch(`${import.meta.env.VITE_API_URL}/admin/stats`);
        if (res.status === 403) return setError("Not authorized");
        if (!res.ok) return setError("Could not load stats");
        setStats(await res.json());
      } catch {
        setError("Could not load stats");
      }
    }
    load();
  }, []);

  if (error) return <p className="p-8 text-stone-600 dark:text-stone-300">{error}</p>;
  if (!stats) return <p className="p-8 text-stone-600 dark:text-stone-300">Loading…</p>;

  const maxSignups = Math.max(1, ...stats.signupsByDay.map((d) => d.count));

  const cards = [
    ["Total users", stats.totalUsers],
    ["Active (7 days)", stats.activeLast7Days],
    ["Channel follows", stats.followLinks],
    ["Videos stored", stats.videos],
    ["Saved videos", stats.savedVideos],
    ["Study pages", stats.studyPages],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl p-6 text-stone-900 dark:text-stone-100">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900"
          >
            <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Signups, last 30 days</h2>
        <div className="mt-4 flex h-40 items-end gap-1">
          {stats.signupsByDay.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              className="flex-1 rounded-t bg-amber-600"
              style={{ height: `${(d.count / maxSignups) * 100}%`, minHeight: d.count ? 4 : 1 }}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Most-followed channels</h2>
        <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {stats.topChannels.map((c) => (
            <li key={c.id} className="flex justify-between px-4 py-3">
              <span>{c.title}</span>
              <span className="text-stone-500 dark:text-stone-400">{c.followers}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}