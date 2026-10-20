
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link
          to="/"
          className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100"
        >
          FOCUS<span className="text-amber-700 dark:text-amber-500">TUBE</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Get started
          </Link>

          {/* Theme toggle */}
          <div className="ml-1 border-l border-stone-200 pl-3 ">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

