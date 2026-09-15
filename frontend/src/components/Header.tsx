import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="text-sm font-semibold tracking-tight text-stone-900">
          FOCUSTUBE
        </div>

        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-amber-800"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

