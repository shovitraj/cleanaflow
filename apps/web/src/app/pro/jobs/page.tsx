"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Bed,
  Bath,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ProJobsPage() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myActiveJobs, setMyActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/pro/jobs");
      if (res.ok) {
        const json = await res.json();
        setAvailableJobs(json.availableJobs || []);
        setMyActiveJobs(json.myActiveJobs || []);
      }
    } catch (e) {
      console.error("Failed to load jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/pro/jobs");
    } else if (isAuthenticated) {
      loadJobs();
    }
  }, [isLoading, isAuthenticated]);

  const handleAcceptJob = async (bookingId: string) => {
    setActionLoading(bookingId);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/pro/jobs/${bookingId}/accept`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept job.");
      }

      setToastMessage("Job accepted! View it in your active schedule.");
      loadJobs();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineJob = async (bookingId: string) => {
    try {
      await fetch(`/api/pro/jobs/${bookingId}/decline`, { method: "POST" });
      setAvailableJobs((prev) => prev.filter((j) => j.id !== bookingId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setToastMessage(status === "COMPLETED" ? "Job completed! Payout sent to your Stripe account." : "Job status updated.");
        loadJobs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="text-teal-700 hover:text-teal-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="text-red-700 hover:text-red-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Available Cleaning Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Jobs available in your registered service ZIP codes. Accept jobs to fill your calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pro/calendar"
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            My Calendar
          </Link>
          <Link
            href="/pro/earnings"
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
          >
            View Earnings
          </Link>
        </div>
      </div>

      {/* Section 1: Active Assigned Jobs */}
      {myActiveJobs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>My Active & Upcoming Jobs ({myActiveJobs.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-white border-2 border-teal-500/40 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                      {job.status}
                    </span>
                    <span className="text-lg font-extrabold text-teal-800">
                      ${(job.cleanerPayoutCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {job.homeProfile?.bedrooms || 2} Bed, {job.homeProfile?.bathrooms || 1} Bath Clean
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(job.scheduledAt).toLocaleDateString()} at {new Date(job.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.address?.street}, {job.address?.zip}</span>
                    </div>
                  </div>

                  {job.notes && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-xl text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Customer Note: </span>
                      {job.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/pro/messages`}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    Chat Customer
                  </Link>

                  <div className="flex gap-2">
                    {job.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleUpdateStatus(job.id, "IN_PROGRESS")}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                      >
                        Start Clean
                      </button>
                    )}

                    {job.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleUpdateStatus(job.id, "COMPLETED")}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition"
                      >
                        Complete Clean
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Available Open Jobs */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-slate-700" />
          <span>Open Jobs in Your Area ({availableJobs.length})</span>
        </h2>

        {availableJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No open jobs right now</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              New customer cleaning requests in your zip codes will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-teal-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                      ZIP: {job.address?.zip || "10001"}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-teal-700">
                        ${(job.cleanerPayoutCents / 100).toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-semibold">Your Payout</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    {job.homeProfile?.bedrooms || 2} Bed, {job.homeProfile?.bathrooms || 1} Bath Home
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(job.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(job.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (~3 hrs)</span>
                    </div>
                  </div>

                  {job.addOns && Object.values(job.addOns).some(Boolean) && (
                    <div className="mb-4">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Add-Ons Included:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(job.addOns).map(([k, v]) =>
                          v ? (
                            <span key={k} className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-semibold capitalize">
                              +{k}
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleDeclineJob(job.id)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    disabled={actionLoading === job.id}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                  >
                    {actionLoading === job.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept Job</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
