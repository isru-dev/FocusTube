

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "../components/MobileNav";
import { SideBar } from "../components/sidebar";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../components/ThemeProvider";

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        setError("Could not load your profile.");
        return;
      }

      setUser(user);
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Logout failed. Please try again.");
      setLoggingOut(false);
      return;
    }

    navigate("/Login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
      <SideBar />

      <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Manage your account and preferences.
            </p>
          </header>

          {/* Profile */}
          <section className="mb-6 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <span className="text-xl">👤</span>
              </div>

              <div>
                <h2 className="text-base font-semibold">Profile</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Your account information
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Email address
                </p>
                <p className="mt-1 break-all text-sm">
                  {user?.email || "Loading profile..."}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  User ID
                </p>
                <p className="mt-1 break-all text-sm text-stone-600 dark:text-stone-300">
                  {user?.id || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="mb-6 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span className="text-xl">
                    {theme === "dark" ? "🌙" : "☀️"}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-semibold">Appearance</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Choose your preferred theme.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium transition hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </button>
            </div>
          </section>

          {/* Logout */}
          <section className="rounded-xl border border-red-200 bg-white p-5 dark:border-red-950 dark:bg-stone-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
                  Log out
                </h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Sign out of your FocusTube account on this device.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
