"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  CreditCard,
  Star,
  CheckCircle,
  ArrowRight,
  MapPin,
  Clock,
  HeartHandshake
} from "lucide-react";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS } from "@cleanaglow/types";

export default function HomePage() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zip || zip.trim().length < 5) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setError("");
    setLoading(true);
    router.push(`/book?zip=${encodeURIComponent(zip.trim())}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Subscription-First Home Cleaning</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-tight">
              A sparkling clean home, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                on automatic schedule.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Book vetted, background-checked independent cleaners in minutes. Save up to 30% with flexible recurring plans.
            </p>

            {/* ZIP Input Funnel Form */}
            <div className="mt-10 max-w-md mx-auto">
              <form onSubmit={handleZipSubmit} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-xl shadow-teal-900/5 border border-slate-200">
                <div className="flex-1 flex items-center px-3 gap-2">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => {
                      setZip(e.target.value.replace(/\D/g, ""));
                      if (error) setError("");
                    }}
                    placeholder="Enter your ZIP code"
                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                >
                  <span>{loading ? "Checking..." : "Get Pricing"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              {error && <p className="text-xs text-red-500 mt-2 text-left px-2">{error}</p>}
            </div>

            {/* Social proof badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>100% Vetted Cleaners</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>4.9 / 5.0 Average Rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* On-demand Tasks */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Need a hand with something else?</h2>
            <p className="mt-3 text-slate-600">
              Furniture assembly, mounting, moving help, repairs and more. Pick a Tasker or post a task and get offers.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {TASK_CATEGORY_KEYS.map((k) => (
              <Link
                key={k}
                href={`/taskers?category=${k}`}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
              >
                {TASK_CATEGORIES[k].label}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/taskers" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition">
              Browse Taskers
            </Link>
            <Link href="/dashboard/tasks/new" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded-xl transition">
              Post a task
            </Link>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Choose Your Cleaning Frequency</h2>
            <p className="mt-3 text-slate-600">
              Enjoy hassle-free recurring cleanings with your dedicated pro. Pause or cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Weekly */}
            <div className="relative rounded-2xl border-2 border-teal-500 bg-white p-8 shadow-xl shadow-teal-500/10 flex flex-col justify-between">
              <div className="absolute -top-3.5 right-6 px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                Most Popular • 30% Off First Clean
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Weekly</h3>
                <p className="text-sm text-slate-500 mt-1">For busy households & families</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">30%</span>
                  <span className="text-slate-500 text-sm">off 1st clean</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Same trusted cleaner every week</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Priority weekend & morning slots</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Deep clean add-on discounts</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Cancel or reschedule anytime</li>
                </ul>
              </div>
              <Link
                href="/book?plan=WEEKLY"
                className="mt-8 block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Select Weekly
              </Link>
            </div>

            {/* Bi-Weekly */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between hover:border-teal-300 transition">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full mb-2">
                  20% Off First Clean
                </div>
                <h3 className="text-xl font-bold text-slate-900">Bi-Weekly</h3>
                <p className="text-sm text-slate-500 mt-1">Every 2 weeks maintenance</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">20%</span>
                  <span className="text-slate-500 text-sm">off 1st clean</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Consistent assigned cleaner</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Flexible lock-in dates</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Custom room instructions</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Pause during vacations</li>
                </ul>
              </div>
              <Link
                href="/book?plan=BIWEEKLY"
                className="mt-8 block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition"
              >
                Select Bi-Weekly
              </Link>
            </div>

            {/* Monthly */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between hover:border-teal-300 transition">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full mb-2">
                  10% Off First Clean
                </div>
                <h3 className="text-xl font-bold text-slate-900">Monthly</h3>
                <p className="text-sm text-slate-500 mt-1">Deep clean reset once a month</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">10%</span>
                  <span className="text-slate-500 text-sm">off 1st clean</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Thorough whole-home clean</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> Seamless Stripe billing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> In-app cleaner chat</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-600 shrink-0" /> No long term contract</li>
                </ul>
              </div>
              <Link
                href="/book?plan=MONTHLY"
                className="mt-8 block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl transition"
              >
                Select Monthly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How CleanAglow Works</h2>
            <p className="mt-3 text-slate-600">3 simple steps to a fresh, effortless home</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customize Your Clean</h3>
              <p className="mt-2 text-sm text-slate-600">
                Choose bedrooms, bathrooms, special add-ons (oven, fridge, windows), and pick your schedule.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Matched with a Top Pro</h3>
              <p className="mt-2 text-sm text-slate-600">
                We pair you with a top-rated, background-checked cleaner in your ZIP code who returns every time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sit Back & Relax</h3>
              <p className="mt-2 text-sm text-slate-600">
                Manage cleans, chat with your cleaner, and handle Stripe billing seamlessly from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
