import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/Feed", label: "Feed" },
  { to: "/search", label: "Search" },
  { to: "/saved", label: "Saved" },
  { to: "/AddChannel", label: "Channels" },
  { to: "/settings", label: "Settings" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-stone-200 bg-stone-50 text-stone-600 shadow-lg lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center text-xs font-medium transition-colors ${
              isActive ? "font-semibold text-amber-700" : "hover:text-stone-900"
            }`
          }
        >
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}