
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    console.log("Logged in:", data.user);
    navigate("/Feed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4 sm:px-6 lg:px-8 dark:bg-stone-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200 bg-stone-50 p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">

        {/* Logo and heading */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-amber-700 dark:text-amber-500">
              FOCUSTUBE
            </h1>
          </Link>

          <h2 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Sign in to your account
          </h2>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 shadow-xs transition-colors duration-200 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 shadow-xs transition-colors duration-200 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-stone-50 shadow-xs transition-colors duration-200 hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus-visible:outline-amber-500"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-stone-600 dark:text-stone-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
