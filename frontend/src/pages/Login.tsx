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
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-stone-50 p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold tracking-tight text-amber-700 mb-2">
              FOCUSTUBE
            </h1>
          </Link>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Sign in to your account
          </h2>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 shadow-xs transition-colors duration-200 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 shadow-xs transition-colors duration-200 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/20"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-stone-50 shadow-xs hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-stone-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-amber-700 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}