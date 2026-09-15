import { Link } from "react-router-dom";

export function SideBar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-r lg:border-stone-200 lg:bg-stone-50 lg:text-stone-900">
        {/* Logo */}
        <div className="border-b border-stone-200 px-6 py-5">
          <Link
            to="/Feed"
            className="text-base font-semibold tracking-tight text-stone-900"
          >
            FOCUSTUBE
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          <Link
            to="/Feed"
            className="rounded-lg px-3 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
          >
            Feed
          </Link>

          <Link
            to="/AddChannel"
            className="rounded-lg px-3 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
          >
            My channels
          </Link>

          <Link
            to="/Saved"
            className="rounded-lg px-3 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
          >
            Saved
          </Link>
        </nav>

        {/* Bottom Navigation */}
        <div className="mt-auto border-t border-stone-200 p-4">
          <Link
            to="/Settings"
            className="block rounded-lg px-3 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
          >
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile / Tablet Navigation */}
      <header className="flex border-b border-stone-200 bg-stone-50 lg:hidden">
        <div className="flex min-h-16 w-full items-center justify-between px-4 sm:px-6">
          
          {/* Logo */}
          <Link
            to="/Feed"
            className="text-base font-semibold tracking-tight text-stone-900"
          >
            FOCUSTUBE
          </Link>

          {/* Mobile Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              to="/Feed"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200/60"
            >
              Feed
            </Link>

            <Link
              to="/AddChannel"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200/60"
            >
              Channels
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}