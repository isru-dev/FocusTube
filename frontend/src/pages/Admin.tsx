import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bookmark,
  Download,
  FileText,
  Film,
  RefreshCw,
  Search,
  Tv,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authFetch } from "../lib/api";

const API_URL =  import.meta.env.VITE_API_URL ||"http://localhost:5000";
const RANGES = [7, 30, 90] as const;

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  channels: number;
  saved: number;
  notes: number;
};

type Stats = {
  range: number;
  totalUsers: number;
  activeLast7Days: number;
  followLinks: number;
  videos: number;
  savedVideos: number;
  studyPages: number;
  signupsByDay: { date: string; count: number }[];
  signupsPrevTotal: number;
  funnel: { label: string; value: number }[];
  quota: {
    limit: number;
    today: number;
    byDay: { date: string; units: number }[];
  } | null;
  users: AdminUser[];
  topChannels: { id: string; title: string; followers: number }[];
};

type SortKey = "email" | "createdAt" | "lastSignInAt" | "channels" | "saved" | "notes";

const nf = new Intl.NumberFormat();

function formatDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function exportCsv(users: AdminUser[]) {
  const header = ["email", "joined", "last_sign_in", "channels", "saved", "notes"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = users.map((u) =>
    [u.email, u.createdAt, u.lastSignInAt ?? "", u.channels, u.saved, u.notes].map(esc).join(",")
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "focustube-users.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [days, setDays] = useState<number>(30);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDesc, setSortDesc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/admin/stats?days=${days}`);
      if (res.status === 403) {
        setError("You are not authorized to view this page.");
        return;
      }
      if (!res.ok) {
        setError("Could not load the stats. Please try again.");
        return;
      }
      setStats(await res.json());
      setUpdatedAt(new Date());
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleUsers = useMemo(() => {
    if (!stats) return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? stats.users.filter((u) => u.email.toLowerCase().includes(q)) : stats.users;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDesc ? -cmp : cmp;
    });
  }, [stats, query, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const signups = stats?.signupsByDay ?? [];
  const maxSignups = Math.max(1, ...signups.map((d) => d.count));
  const signupsTotal = signups.reduce((sum, d) => sum + d.count, 0);
  const dailyAverage = signups.length ? signupsTotal / signups.length : 0;
  const peak = signups.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { date: "", count: 0 }
  );
  const prevTotal = stats?.signupsPrevTotal ?? 0;
  const change =
    prevTotal > 0 ? Math.round(((signupsTotal - prevTotal) / prevTotal) * 100) : null;

  const maxFollowers = Math.max(1, ...(stats?.topChannels ?? []).map((c) => c.followers));
  const activeRate =
    stats && stats.totalUsers > 0
      ? Math.round((stats.activeLast7Days / stats.totalUsers) * 100)
      : 0;

  const cards: { label: string; value: number; icon: LucideIcon; hint?: string }[] = stats
    ? [
        { label: "Total users", value: stats.totalUsers, icon: Users },
        {
          label: "Active, last 7 days",
          value: stats.activeLast7Days,
          icon: Activity,
          hint: `${activeRate}% of users`,
        },
        { label: "Channel follows", value: stats.followLinks, icon: Tv },
        { label: "Videos stored", value: stats.videos, icon: Film },
        { label: "Saved videos", value: stats.savedVideos, icon: Bookmark },
        { label: "Study pages", value: stats.studyPages, icon: FileText },
      ]
    : [];

  const panel =
    "rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900";

  return (
    <div className="bg-stone-900">
    <div className="mx-auto max-w-5xl p-6 text-stone-900 dark:text-stone-100 ">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-300">Admin dashboard</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Usage overview for FocusTube"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Date range"
            className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-900"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  days === r
                    ? "bg-amber-700 text-stone-50 dark:bg-amber-600"
                    : "text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading && !stats && !error && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-stone-200 bg-stone-200/60 dark:border-stone-800 dark:bg-stone-800/60"
            />
          ))}
        </div>
      )}

      {stats && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {/* Stat cards */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Signups trend */}
          <section className={`mt-10 ${panel}`}>
            <h2 className="text-lg font-semibold">Signups, last {stats.range} days</h2>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Total" value={nf.format(signupsTotal)} />
              <Metric label="Daily average" value={dailyAverage.toFixed(1)} />
              <Metric
                label="Peak day"
                value={peak.count > 0 ? `${peak.count} · ${formatDay(peak.date)}` : "—"}
              />
              <Metric
                label="vs previous period"
                value={change === null ? (signupsTotal > 0 ? "New" : "—") : `${change > 0 ? "+" : ""}${change}%`}
                tone={change === null ? "neutral" : change >= 0 ? "up" : "down"}
              />
            </dl>

            <div className="mt-6 flex gap-3">
              <div className="flex h-44 flex-col justify-between text-right text-xs text-stone-500 dark:text-stone-400">
                <span>{maxSignups}</span>
                <span>0</span>
              </div>

              <div className="relative h-44 flex-1">
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-stone-300 dark:border-stone-700" />
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-stone-300 dark:border-stone-700" />
                <div className="absolute inset-x-0 bottom-0 border-t border-stone-300 dark:border-stone-700" />

                <div className="relative flex h-full items-end gap-0.5" aria-label="Signups per day">
                  {signups.map((d) => (
                    <div key={d.date} className="group relative flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-amber-600 transition-colors group-hover:bg-amber-500 dark:bg-amber-500 dark:group-hover:bg-amber-400"
                        style={{
                          height: `${(d.count / maxSignups) * 100}%`,
                          minHeight: d.count ? 4 : 2,
                          opacity: d.count ? 1 : 0.25,
                        }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow group-hover:block dark:bg-stone-100 dark:text-stone-900">
                        {formatDay(d.date)}: {d.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {signups.length > 0 && (
              <div className="mt-2 flex justify-between pl-9 text-xs text-stone-500 dark:text-stone-400">
                <span>{formatDay(signups[0].date)}</span>
                <span>{formatDay(signups[Math.floor(signups.length / 2)].date)}</span>
                <span>{formatDay(signups[signups.length - 1].date)}</span>
              </div>
            )}
          </section>

          {/* Funnel + quota */}
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className={panel}>
              <h2 className="text-lg font-semibold">Activation funnel</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                How many users reached each step.
              </p>

              <ol className="mt-5 space-y-4">
                {stats.funnel.map((f) => {
                  const base = stats.funnel[0]?.value || 1;
                  const pct = Math.round((f.value / base) * 100);
                  return (
                    <li key={f.label}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium">{f.label}</span>
                        <span className="text-stone-500 dark:text-stone-400">
                          {nf.format(f.value)} · {pct}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-amber-600 dark:bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className={panel}>
              <h2 className="text-lg font-semibold">YouTube API quota</h2>

              {stats.quota ? (
                <QuotaPanel quota={stats.quota} />
              ) : (
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                  Quota tracking isn&apos;t set up yet. Create the
                  <code className="mx-1 rounded bg-stone-200 px-1 py-0.5 text-xs dark:bg-stone-800">
                    youtube_api_calls
                  </code>
                  table and log calls from the server.
                </p>
              )}
            </section>
          </div>

          {/* Top channels */}
          <section className={`mt-6 ${panel}`}>
            <h2 className="text-lg font-semibold">Most-followed channels</h2>

            {stats.topChannels.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
                No channels have been followed yet.
              </p>
            ) : (
              <ol className="mt-5 space-y-4">
                {stats.topChannels.map((c, i) => (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="truncate font-medium">
                        <span className="mr-2 text-stone-400 dark:text-stone-500">{i + 1}.</span>
                        {c.title}
                      </span>
                      <span className="shrink-0 text-stone-500 dark:text-stone-400">
                        {nf.format(c.followers)} {c.followers === 1 ? "follower" : "followers"}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                      <div
                        className="h-full rounded-full bg-amber-600 dark:bg-amber-500"
                        style={{ width: `${(c.followers / maxFollowers) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Users table */}
          <section className={`mt-6 ${panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Users <span className="text-stone-400 dark:text-stone-500">({visibleUsers.length})</span>
              </h2>

              <div className="flex items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Search users by email</span>
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search email"
                    className="w-52 rounded-lg border border-stone-300 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-600 dark:border-stone-700 dark:bg-stone-900"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => exportCsv(visibleUsers)}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <Download size={16} />
                  CSV
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <tr>
                    <Th label="Email" k="email" {...{ sortKey, sortDesc, toggleSort }} />
                    <Th label="Joined" k="createdAt" {...{ sortKey, sortDesc, toggleSort }} />
                    <Th label="Last sign-in" k="lastSignInAt" {...{ sortKey, sortDesc, toggleSort }} />
                    <Th label="Channels" k="channels" align="right" {...{ sortKey, sortDesc, toggleSort }} />
                    <Th label="Saved" k="saved" align="right" {...{ sortKey, sortDesc, toggleSort }} />
                    <Th label="Notes" k="notes" align="right" {...{ sortKey, sortDesc, toggleSort }} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {visibleUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="max-w-[14rem] truncate py-3 pr-4">{u.email || "—"}</td>
                      <td className="py-3 pr-4 text-stone-600 dark:text-stone-300">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 text-stone-600 dark:text-stone-300">
                        {timeAgo(u.lastSignInAt)}
                      </td>
                      <td className="py-3 pr-4 text-right">{u.channels}</td>
                      <td className="py-3 pr-4 text-right">{u.saved}</td>
                      <td className="py-3 text-right">{u.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleUsers.length === 0 && (
                <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
                  No users match your search.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
        <Icon size={18} className="text-amber-700 dark:text-amber-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{nf.format(value)}</p>
      {hint && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "up" | "down";
}) {
  const color =
    tone === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "down"
        ? "text-red-600 dark:text-red-400"
        : "";
  return (
    <div>
      <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${color}`}>{value}</dd>
    </div>
  );
}

function QuotaPanel({
  quota,
}: {
  quota: { limit: number; today: number; byDay: { date: string; units: number }[] };
}) {
  const pct = Math.min(100, Math.round((quota.today / quota.limit) * 100));
  const barColor =
    pct >= 90 ? "bg-red-600" : pct >= 70 ? "bg-amber-500" : "bg-emerald-600";
  const maxUnits = Math.max(1, ...quota.byDay.map((d) => d.units));

  return (
    <>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Units used today (UTC). YouTube&apos;s own reset is at midnight Pacific, so treat this as an estimate.
      </p>

      <div className="mt-5 flex items-baseline justify-between text-sm">
        <span className="text-2xl font-semibold">{nf.format(quota.today)}</span>
        <span className="text-stone-500 dark:text-stone-400">
          of {nf.format(quota.limit)} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-6 flex h-16 items-end gap-1" aria-label="Quota units, last 7 days">
        {quota.byDay.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-stone-400 group-hover:bg-stone-500 dark:bg-stone-600 dark:group-hover:bg-stone-500"
              style={{ height: `${(d.units / maxUnits) * 100}%`, minHeight: d.units ? 3 : 1 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-xs text-stone-50 shadow group-hover:block dark:bg-stone-100 dark:text-stone-900">
              {formatDay(d.date)}: {nf.format(d.units)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Last 7 days</p>
    </>
  );
}

function Th({
  label,
  k,
  sortKey,
  sortDesc,
  toggleSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDesc: boolean;
  toggleSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDesc ? "descending" : "ascending") : "none"}
      className={`pb-3 pr-4 font-medium ${align === "right" ? "text-right" : ""}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={`uppercase tracking-wider hover:text-stone-900 dark:hover:text-stone-100 ${
          active ? "text-stone-900 dark:text-stone-100" : ""
        }`}
      >
        {label}
        {active ? (sortDesc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
}