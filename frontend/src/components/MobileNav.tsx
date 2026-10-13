import { NavLink } from "react-router-dom";
import { Home, Bookmark, Radio, Settings } from "lucide-react";

const navItems = [
  { to: "/Feed", label: "Feed", icon: Home },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/AddChannel", label: "Channels", icon: Radio },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 text-zinc-400 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-[72px] max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `group relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200 ${
                  isActive
                    ? "text-amber-400"
                    : "text-zinc-500 hover:text-zinc-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-[3px] w-9 rounded-b-full bg-amber-400"
                    />
                  )}

                  <span
                    className={`flex h-9 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-amber-400/10"
                        : "group-hover:bg-zinc-800"
                    }`}
                  >
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <span
                    className={`text-[11px] leading-tight ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
