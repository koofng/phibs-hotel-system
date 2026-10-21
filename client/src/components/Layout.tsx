import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type NavItem = { to: string; label: string; end?: boolean };

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/reservations", label: "Reservations" },
  { to: "/guests", label: "Guests" },
  { to: "/inventory", label: "Rooms & Types" },
];

const adminNavItems: NavItem[] = [
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/users", label: "Staff" },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `block rounded-md px-3 py-2 text-sm font-medium transition lg:py-1.5 ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = user?.role === "ADMIN" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold whitespace-nowrap text-slate-900">🏨 Hotel Admin</span>
            <nav className="hidden gap-1 lg:flex">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-3 text-sm lg:flex">
            <span className="text-slate-500">
              {user?.fullName} <span className="text-slate-400">({user?.role})</span>
            </span>
            <button
              onClick={() => logout()}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 px-4 py-3 lg:hidden">
            <nav className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
              <span className="min-w-0 truncate text-slate-500">
                {user?.fullName} <span className="text-slate-400">({user?.role})</span>
              </span>
              <button
                onClick={() => logout()}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
