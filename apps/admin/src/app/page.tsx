"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  AlertTriangle,
  MapPin,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Plus
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "subscriptions" | "disputes" | "zones" | "config">("overview");

  const [metrics, setMetrics] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Zone Form
  const [newZip, setNewZip] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("NY");
  const [newBasePrice, setNewBasePrice] = useState("12000");

  // Config Update
  const [commissionRate, setCommissionRate] = useState("0.30");
  const [cancellationFee, setCancellationFee] = useState("0.50");

  // Dispute resolution modal
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes, sRes, dRes, zRes, cRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/bookings"),
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/disputes"),
        fetch("/api/admin/zones"),
        fetch("/api/admin/config")
      ]);

      if (mRes.ok) setMetrics((await mRes.json()).metrics);
      if (bRes.ok) setBookings((await bRes.json()).bookings || []);
      if (sRes.ok) setSubscriptions((await sRes.json()).subscriptions || []);
      if (dRes.ok) setDisputes((await dRes.json()).disputes || []);
      if (zRes.ok) setZones((await zRes.json()).zones || []);
      if (cRes.ok) {
        const conf = (await cRes.json()).configs || [];
        setConfigs(conf);
        const comm = conf.find((c: any) => c.key === "PLATFORM_COMMISSION_RATE");
        const canc = conf.find((c: any) => c.key === "CANCELLATION_FEE_PERCENT");
        if (comm) setCommissionRate(comm.value);
        if (canc) setCancellationFee(canc.value);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadAllData();
    }
  }, [status]);

  const handleResolveDispute = async (status: string) => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolution: resolutionText
        })
      });
      if (res.ok) {
        setSelectedDispute(null);
        setResolutionText("");
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZip || !newCity) return;
    try {
      const res = await fetch("/api/admin/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: newZip,
          city: newCity,
          state: newState,
          basePriceCents: Number(newBasePrice),
          isActive: true
        })
      });
      if (res.ok) {
        setNewZip("");
        setNewCity("");
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "PLATFORM_COMMISSION_RATE", value: commissionRate })
      });
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "CANCELLATION_FEE_PERCENT", value: cancellationFee })
      });
      loadAllData();
      alert("Platform settings saved successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black">
              CA
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">CleanAglow</h2>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Ops Admin</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: "overview", label: "Overview & KPIs", icon: LayoutDashboard },
              { id: "bookings", label: "Bookings", icon: Calendar, badge: bookings.length },
              { id: "subscriptions", label: "Subscriptions", icon: CreditCard, badge: metrics?.activeSubscriptions },
              { id: "disputes", label: "Disputes Queue", icon: AlertTriangle, badge: metrics?.openDisputes, alert: metrics?.openDisputes > 0 },
              { id: "zones", label: "Service Zones", icon: MapPin },
              { id: "config", label: "Platform Config", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-slate-950 text-teal-300"
                          : tab.alert
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">{session?.user?.name || "Admin"}</span>
            <span className="text-[10px] text-slate-500 block truncate">{session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Marketplace Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Gross Bookings (GMV)</span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  ${((metrics?.gmvCents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-teal-400 mt-1 block">Total customer volume</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Platform Net Revenue</span>
                <div className="text-3xl font-extrabold text-teal-400 mt-2">
                  ${((metrics?.revenueCents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Retained commission fees</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Subscriptions</span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {metrics?.activeSubscriptions || 0}
                </div>
                <span className="text-xs text-teal-400 mt-1 block">Recurring customers</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Registered Supply</span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {metrics?.totalCleaners || 0} Pros
                </div>
                <span className="text-xs text-slate-400 mt-1 block">{metrics?.totalCustomers || 0} customers</span>
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Recent Bookings Stream</h2>
              <div className="divide-y divide-slate-800 text-xs">
                {bookings.slice(0, 6).map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {b.customer?.name} → {b.cleaner?.name || "Unassigned"}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {new Date(b.scheduledAt).toLocaleDateString()} • ZIP: {b.address?.zip || "N/A"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">${(b.totalAmountCents / 100).toFixed(2)}</span>
                      <span className="text-[10px] font-bold uppercase text-teal-400">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === "bookings" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">All Bookings</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cleaner</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Fee (30%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{b.customer?.name}</td>
                      <td className="py-3 px-4 text-slate-300">{b.cleaner?.name || "—"}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-teal-300">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ${(b.totalAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-teal-400">
                        ${(b.platformFeeCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Subscriptions */}
        {activeTab === "subscriptions" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Stripe Sub ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{s.customer?.name}</td>
                      <td className="py-3 px-4 font-bold text-teal-400">{s.plan}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.stripeSubscriptionId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(s.currentPeriodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Disputes Queue */}
        {activeTab === "disputes" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Disputes Queue</h1>
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                  No disputes reported. Clean operations!
                </div>
              ) : (
                disputes.map((d) => (
                  <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                        {d.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        Reported: {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm mb-1">{d.reason}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">{d.description}</p>

                    <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-400 mb-4">
                      Customer: <span className="text-white font-semibold">{d.reporter?.name}</span> • Cleaner:{" "}
                      <span className="text-white font-semibold">{d.booking?.cleaner?.name || "N/A"}</span> • Amount: $
                      {((d.booking?.totalAmountCents || 0) / 100).toFixed(2)}
                    </div>

                    {d.resolution && (
                      <div className="p-3 bg-teal-950/40 border border-teal-800 rounded-xl text-xs text-teal-300 mb-4">
                        Resolution Note: {d.resolution}
                      </div>
                    )}

                    {d.status === "OPEN" && (
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setResolutionText("Resolved with customer and pro.");
                        }}
                        className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 transition"
                      >
                        Investigate & Resolve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Service Zones */}
        {activeTab === "zones" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Service Zones</h1>
            </div>

            {/* Add New Zone Form */}
            <form onSubmit={handleAddZone} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ZIP Code</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={newZip}
                  onChange={(e) => setNewZip(e.target.value)}
                  placeholder="90210"
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Beverly Hills"
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">State</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="CA"
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-16"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Base Price (Cents)</label>
                <input
                  type="number"
                  required
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  placeholder="12000"
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-28"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service ZIP</span>
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">ZIP</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {zones.map((z) => (
                    <tr key={z.id}>
                      <td className="py-3 px-4 font-mono font-bold text-white">{z.zipCode}</td>
                      <td className="py-3 px-4 text-slate-300">{z.city}</td>
                      <td className="py-3 px-4 text-slate-400">{z.state}</td>
                      <td className="py-3 px-4 font-bold text-teal-400">
                        ${(z.basePriceCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300">
                          {z.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Platform Config */}
        {activeTab === "config" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Platform Economics Config</h1>

            <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Platform Commission Rate (e.g. 0.30 for 30%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Percentage of booking total kept as platform fee.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Late Cancellation Fee Percent (e.g. 0.50 for 50%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="1.00"
                  value={cancellationFee}
                  onChange={(e) => setCancellationFee(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Fee charged when customer cancels within 24h.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/20 text-xs uppercase tracking-wider"
              >
                Save Platform Config
              </button>
            </form>
          </div>
        )}

        {/* Dispute Resolution Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Resolve Dispute</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedDispute.description}</p>

              <textarea
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Enter resolution notes / action taken..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white mb-4"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleResolveDispute("RESOLVED")}
                  className="px-5 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400"
                >
                  {actionLoading ? "Resolving..." : "Mark as Resolved"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
