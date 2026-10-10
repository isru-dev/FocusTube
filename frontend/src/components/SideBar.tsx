

import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function SideBar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { name: "Feed", path: "/Feed" },
    { name: "Saved", path: "/Saved" },
    { name: "Channels", path: "/AddChannel" },
    { name: "Settings", path: "/Settings" },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-stone-50 text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 lg:flex">
      {/* Logo */}
      <div className="p-6">
        <Link
          to="/Feed"
          className="text-sm font-bold tracking-tight text-amber-700 dark:text-amber-500"
        >
          FOCUSTUBE
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {links.map((link) => {
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-700/10 font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                  : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="border-t border-stone-200 p-4 dark:border-stone-800">
        <p className="mb-3 px-1 text-xs font-medium text-stone-500 dark:text-stone-400">
          APPEARANCE
        </p>

        <ThemeToggle />
      </div>
    </aside>
  );
}
