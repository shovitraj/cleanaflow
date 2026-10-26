"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";

function ProEarningsContent() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripeStatus = searchParams.get("stripe");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(
    stripeStatus === "return" || stripeStatus === "success_mock"
      ? "Stripe Connect account connected successfully!"
      : ""
  );

  const loadEarnings = async () => {
    try {
      const res = await fetch("/api/pro/earnings");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?callbackUrl=/pro/earnings");
    } else if (isAuthenticated) {
      loadEarnings();
    }
  }, [isLoading, isAuthenticated]);

  const handleStartStripeOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const isConnected = data?.profile?.onboardingComplete || !!data?.profile?.stripeConnectAccountId;

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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Earnings & Payouts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct deposit payouts powered by Stripe Connect Standard.
        </p>
      </div>

      {/* Stripe Connect Onboarding Banner */}
      {!isConnected ? (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-teal-800 to-teal-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-300" />
              <span className="font-bold text-lg">Connect Bank Account with Stripe</span>
            </div>
            <p className="text-xs text-teal-100 max-w-xl leading-relaxed">
              To receive automated direct deposit payouts immediately upon completing cleaning jobs, set up your Stripe Connect account.
            </p>
          </div>
          <button
            onClick={handleStartStripeOnboarding}
            disabled={onboardingLoading}
            className="px-6 py-3 rounded-xl bg-white text-teal-900 font-bold text-sm hover:bg-teal-50 transition flex items-center justify-center gap-2 shrink-0 shadow-md"
          >
            {onboardingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Set Up Payouts</span><ExternalLink className="w-4 h-4" /></>}
          </button>
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-bold">Stripe Connect Active: Payouts are transferred automatically upon job completion.</span>
          </div>
          <span className="font-mono text-slate-500">{data?.profile?.stripeConnectAccountId}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Earned</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            ${((data?.summary?.totalEarningsCents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">All time marketplace earnings</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">This Week</span>
          <div className="mt-2 text-3xl font-extrabold text-teal-700">
            ${((data?.summary?.thisWeekEarningsCents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-xs text-teal-600 mt-1 block font-medium">Last 7 days</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">This Month</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            ${((data?.summary?.thisMonthEarningsCents || 0) / 100).toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Current calendar month</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jobs Completed</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {data?.summary?.completedJobsCount || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Successfully fulfilled</span>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Payout History</h2>

        {(!data?.payouts || data.payouts.length === 0) ? (
          <p className="text-xs text-slate-500 py-6 text-center">No payout records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transfer Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payouts.map((payout: any) => (
                  <tr key={payout.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {payout.stripeTransferId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ${(payout.amountCents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProEarningsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>}>
      <ProEarningsContent />
    </Suspense>
  );
}
