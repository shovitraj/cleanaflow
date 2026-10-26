"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, User, Briefcase, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "CLEANER" ? "CLEANER" : "CUSTOMER";

  const [role, setRole] = useState<"CUSTOMER" | "CLEANER">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zipCodes, setZipCodes] = useState("10001, 10002");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          serviceZipCodes: role === "CLEANER" ? zipCodes.split(",").map((z) => z.trim()) : []
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Automatically sign in upon registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push(role === "CLEANER" ? "/pro/jobs" : "/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8 sm:p-10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-teal-600/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create your Account</h1>
        <p className="text-sm text-slate-500 mt-1">Join CleanAglow in seconds</p>
      </div>

      {/* Role Toggle Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            role === "CUSTOMER"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          I Need Cleaning
        </button>
        <button
          type="button"
          onClick={() => setRole("CLEANER")}
          className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            role === "CLEANER"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>I Am a Cleaner</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Full Name</label>
          <div className="flex items-center gap-2 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 bg-slate-50">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Email Address</label>
          <div className="flex items-center gap-2 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 bg-slate-50">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password</label>
          <div className="flex items-center gap-2 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 bg-slate-50">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {role === "CLEANER" && (
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Service ZIP Codes (comma-separated)
            </label>
            <input
              type="text"
              required
              value={zipCodes}
              onChange={(e) => setZipCodes(e.target.value)}
              placeholder="10001, 10002, 10003"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 focus:outline-teal-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-teal-600 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-teal-600 animate-spin" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
