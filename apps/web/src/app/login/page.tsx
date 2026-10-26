"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8 sm:p-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-teal-600/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your cleans & schedule</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Email Address
          </label>
          <div className="flex items-center gap-2 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 bg-slate-50">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <a href="#" className="text-xs text-teal-600 hover:underline">Forgot?</a>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 bg-slate-50">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {/* Quick Demo Login Fill Buttons */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 mb-2">Demo Accounts (Password: Password123!)</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => { setEmail("sarah@example.com"); setPassword("Password123!"); }}
            className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition"
          >
            Customer (Sarah)
          </button>
          <button
            type="button"
            onClick={() => { setEmail("maria@cleanaglow.com"); setPassword("Password123!"); }}
            className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition"
          >
            Cleaner (Maria)
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-teal-600 font-semibold hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-teal-600 animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
