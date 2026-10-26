"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";

export default function ProCalendarPage() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendar = async () => {
    try {
      const res = await fetch("/api/pro/calendar");
      if (res.ok) {
        const json = await res.json();
        setBookings(json.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/pro/calendar");
    } else if (isAuthenticated) {
      loadCalendar();
    }
  }, [isLoading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Confirmed cleans and arrival times</p>
        </div>
        <Link
          href="/pro/jobs"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
        >
          + Find More Jobs
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No scheduled cleans found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Accept pending jobs on your job board to start earning.</p>
            <Link
              href="/pro/jobs"
              className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-block"
            >
              Go to Job Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase">
                      {new Date(booking.scheduledAt).toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="text-base font-extrabold leading-tight">
                      {new Date(booking.scheduledAt).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {booking.customer?.name || "Customer"} — {booking.homeProfile?.bedrooms || 2} Bed Clean
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          booking.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {booking.address?.street}, {booking.address?.zip}
                      </span>
                      {booking.customer?.phone && (
                        <span>Phone: {booking.customer.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right self-end md:self-center">
                  <div className="text-lg font-extrabold text-teal-700">
                    ${(booking.cleanerPayoutCents / 100).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Payout</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
