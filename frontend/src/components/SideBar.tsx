import { Link, useLocation } from "react-router-dom";

export function SideBar() {
  const location = useLocation();

  // Helper to check if link is active
  const isActive = (path: string) => location.pathname === path;

  const links = [
    { name: "Feed", path: "/Feed" },
    { name: "Saved", path: "/Saved" },
    { name: "Channels", path: "/AddChannel" },
    { name: "Settings", path: "/Settings" },
  ];

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-stone-50 text-stone-900">
      <div className="p-6">
        <Link to="/Feed" className="text-sm font-bold tracking-tight text-amber-700">
          FOCUSTUBE
        </Link>
      </div>

      <nav className="flex flex-col gap-1 px-4">
        {links.map((link) => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-700/10 text-amber-800 font-semibold"
                  : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}