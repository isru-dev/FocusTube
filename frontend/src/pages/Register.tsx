
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errmessage, seterrmessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    seterrmessage("");
    setSuccessMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      seterrmessage(error.message);
      setLoading(false);
      return;
    }

    console.log("Registered:", data.user);
    setLoading(false);
    setSuccessMsg(
      "Registration successful! Please check your email for confirmation instructions."
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4 sm:px-6 lg:px-8 dark:bg-stone-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200 bg-stone-50 p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-amber-700 dark:text-amber-500">
              FOCUSTUBE
            </h1>
          </Link>

          <h2 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Create an account
          </h2>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div className="space-y-4">
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

          {errmessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errmessage}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-stone-50 shadow-xs transition-colors duration-200 hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus-visible:outline-amber-500"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-center text-sm text-stone-600 dark:text-stone-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
