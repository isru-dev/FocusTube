
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, SunMoon, MoonStar } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-50 text-base transition hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
    >
      {isDark ? <Sun /> : <MoonStar />}
    </button>
  );
}

