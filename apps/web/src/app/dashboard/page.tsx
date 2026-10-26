"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CreditCard,
  User,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronRight
} from "lucide-react";

function CustomerDashboardContent() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewBooking = searchParams.get("booking") === "new";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "subscription">("upcoming");

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalType, setModalType] = useState<"reschedule" | "cancel" | "review" | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(isNewBooking ? "Booking confirmed successfully!" : "");

  const loadData = async () => {
    try {
      const res = await fetch("/api/customer/dashboard-data");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/dashboard");
    } else if (isAuthenticated) {
      loadData();
    }
  }, [isLoading, isAuthenticated]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: "POST"
      });
      const resJson = await res.json();
      if (resJson.success) {
        setToastMessage(resJson.feeApplied ? "Booking canceled. 50% late cancellation fee applied." : "Booking canceled successfully.");
        setModalType(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: rescheduleDate })
      });
      const resJson = await res.json();
      if (resJson.success) {
        setToastMessage("Booking rescheduled successfully!");
        setModalType(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          rating: reviewRating,
          body: reviewBody
        })
      });
      if (res.ok) {
        setToastMessage("Thank you for your review!");
        setModalType(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStripePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const upcomingBookings = data?.bookings?.filter((b: any) =>
    ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
  ) || [];

  const pastBookings = data?.bookings?.filter((b: any) =>
    ["COMPLETED", "CANCELED", "DISPUTED"].includes(b.status)
  ) || [];

  const activeCleaner = upcomingBookings.find((b: any) => b.cleaner)?.cleaner;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Banner */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {session?.user?.name || "Friend"}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your scheduled home cleans, assigned cleaner, and subscription.
          </p>
        </div>

        <Link
          href="/book"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Book Extra Clean</span>
        </Link>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Subscription Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Subscription Plan
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {data?.subscription ? data.subscription.status : "No Active Plan"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {data?.subscription ? `${data.subscription.plan} Cleaning` : "Pay-As-You-Go"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {data?.subscription
                ? `Renews on ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}`
                : "Save up to 30% by subscribing to a recurring plan."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {data?.subscription ? (
              <button
                onClick={handleStripePortal}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>Manage via Stripe Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link href="/book" className="text-xs font-bold text-teal-700 hover:underline">
                Explore Subscription Plans →
              </Link>
            )}
          </div>
        </div>

        {/* Assigned Cleaner Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assigned Cleaner
              </span>
              {activeCleaner && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{activeCleaner.cleanerProfile?.rating ?? "5.0"}</span>
                </span>
              )}
            </div>

            {activeCleaner ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                  {activeCleaner.name?.[0] || "C"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{activeCleaner.name}</h4>
                  <p className="text-xs text-slate-500">
                    {activeCleaner.cleanerProfile?.reviewCount ?? 0} reviews completed
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-bold text-slate-900">Matching Top Cleaner</h4>
                <p className="text-xs text-slate-500 mt-1">
                  We match you with an experienced cleaner before your job date.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {activeCleaner ? (
              <Link
                href="/dashboard/messages"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Cleaner</span>
              </Link>
            ) : (
              <span className="text-xs text-slate-400">Assigned upon dispatch</span>
            )}
          </div>
        </div>

        {/* Address & Home Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Service Address
              </span>
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {data?.address ? data.address.street : "No address saved"}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {data?.address ? `${data.address.city}, ${data.address.state} ${data.address.zip}` : "Set up your home location"}
            </p>
            {data?.homeProfile && (
              <div className="mt-2 text-xs text-slate-600 font-medium">
                {data.homeProfile.bedrooms} Bed • {data.homeProfile.bathrooms} Bath
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs text-teal-700 font-medium">
              Entry: {data?.homeProfile?.entryInstructions || "Standard buzz/doorbell"}
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`text-sm font-bold pb-2 -mb-4 transition border-b-2 ${
              activeTab === "upcoming"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Upcoming Cleans ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`text-sm font-bold pb-2 -mb-4 transition border-b-2 ${
              activeTab === "history"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Past History ({pastBookings.length})
          </button>
        </div>

        {/* Tab 1: Upcoming Cleans */}
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No upcoming cleans</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">You don't have any cleans scheduled right now.</p>
                <Link
                  href="/book"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Book a Clean Now
                </Link>
              </div>
            ) : (
              upcomingBookings.map((b: any) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-teal-200 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold">
                        {new Date(b.scheduledAt).toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-base font-extrabold leading-tight">
                        {new Date(b.scheduledAt).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {b.homeProfile?.bedrooms || 2} Bed, {b.homeProfile?.bathrooms || 1} Bath Home Clean
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            b.status === "CONFIRMED"
                              ? "bg-teal-100 text-teal-800"
                              : b.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(b.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span>Total: ${(b.totalAmountCents / 100).toFixed(2)}</span>
                        {b.cleaner && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-slate-700">Cleaner: {b.cleaner.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        setRescheduleDate(new Date(b.scheduledAt).toISOString().slice(0, 16));
                        setModalType("reschedule");
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        setModalType("cancel");
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {pastBookings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No past booking records found.</p>
            ) : (
              pastBookings.map((b: any) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {new Date(b.scheduledAt).toLocaleDateString()} Clean
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          b.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : b.status === "DISPUTED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ${(b.totalAmountCents / 100).toFixed(2)} • Cleaner: {b.cleaner?.name || "Independent Pro"}
                    </p>
                  </div>

                  <div>
                    {b.status === "COMPLETED" && !b.review && (
                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setModalType("review");
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Leave Review</span>
                      </button>
                    )}
                    {b.review && (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Rated {b.review.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {modalType === "reschedule" && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Reschedule Cleaning</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Pick a new date and time for your clean.
            </p>
            <input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Back
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRescheduleBooking}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {modalType === "cancel" && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Booking?</h3>
            <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
              If canceled less than 24 hours before your scheduled arrival time, a 50% cancellation fee ($
              {(Math.round(selectedBooking.totalAmountCents * 0.5) / 100).toFixed(2)}) will apply to compensate your cleaner for reserved time.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Keep Clean
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCancelBooking}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {modalType === "review" && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Review Your Cleaner</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              How did {selectedBooking.cleaner?.name || "your cleaner"} do?
            </p>

            {/* Star Rating Selector */}
            <div className="flex items-center gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 transition ${
                      star <= reviewRating
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="What made your experience great?"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs mb-4 focus:outline-teal-500"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSubmitReview}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
