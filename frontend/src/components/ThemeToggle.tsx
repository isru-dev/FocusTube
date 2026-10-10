
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-left text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
    >
      {theme === "light" ? "🌙  Switch to dark mode" : "☀️  Switch to light mode"}
    </button>
  );
}

