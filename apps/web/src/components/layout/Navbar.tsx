"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Calendar, User, LogOut, MessageSquare, Briefcase, Bell, ListChecks } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { session, isAuthenticated, isCustomer, isCleaner, isAdmin, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const unread = data.notifications.filter((n: any) => !n.readAt).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
              CleanAglow
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 md:gap-6">
          {!isCleaner && (
            <>
              <Link href="/taskers" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition hidden sm:inline-block">
                Browse Taskers
              </Link>
              <Link href="/book" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition hidden sm:inline-block">
                Book a Clean
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isCustomer && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <ListChecks className="w-4 h-4" />
                    <span>My Tasks</span>
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition relative"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Messages</span>
                  </Link>
                </>
              )}

              {isCleaner && (
                <>
                  <Link
                    href="/pro/jobs"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Job Feed</span>
                  </Link>
                  <Link
                    href="/pro/tasks"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <ListChecks className="w-4 h-4" />
                    <span>Tasks</span>
                  </Link>
                  <Link
                    href="/pro/profile"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/pro/calendar"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Calendar</span>
                  </Link>
                  <Link
                    href="/pro/earnings"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <span>Earnings</span>
                  </Link>
                  <Link
                    href="/pro/messages"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Messages</span>
                  </Link>
                </>
              )}

              {unreadCount > 0 && (
                <div className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500" />
                </div>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-medium text-slate-600 hidden md:inline">
                  {session?.user?.name || session?.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-teal-600 px-3 py-2 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/book"
                className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
