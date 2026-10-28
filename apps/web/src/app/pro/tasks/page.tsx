"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Calendar } from "lucide-react";
import { categoryLabel, calculateTaskPrice } from "@cleanaglow/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyle } from "@/components/tasks/status";

function TaskMeta({ task }: { task: any }) {
  return (
    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
      <span>{categoryLabel(task.category)}</span>
      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(task.scheduledAt).toLocaleString()}</span>
      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{task.street && !task.street.startsWith("Address shared") ? `${task.street}, ` : ""}{task.city}, {task.zip}</span>
      <span>~{task.estimatedHours} hr</span>
    </div>
  );
}

export default function ProTasksPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [bid, setBid] = useState<{ taskId: string; rate: number; message: string } | null>(null);
  const [hours, setHours] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/pro/tasks");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const call = async (key: string, url: string, init: RequestInit, okMsg: string) => {
    setBusy(key);
    setMsg("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setMsg(okMsg);
      setBid(null);
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (isLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  if (!data) return <div className="py-20 text-center text-slate-600">Couldn't load tasks.</div>;

  const card = "bg-white rounded-2xl border border-slate-200 p-5";
  const h2 = "text-lg font-bold text-slate-900 mb-3";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Matching your skills ({data.profile.skills.length}) and ZIPs ({data.profile.serviceZipCodes.join(", ")}). Edit them in your profile.</p>
      </div>
      {msg && <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-900">{msg}</div>}

      {data.invitations.length > 0 && (
        <section>
          <h2 className={h2}>Direct requests ({data.invitations.length})</h2>
          <div className="space-y-3">
            {data.invitations.map((t: any) => {
              const q = calculateTaskPrice(data.profile.hourlyRateCents, t.estimatedHours);
              return (
                <div key={t.id} className={`${card} border-teal-300`}>
                  <h3 className="font-bold text-slate-900">{t.title}</h3>
                  <TaskMeta task={t} />
                  <p className="text-sm text-slate-700 mt-2">{t.description}</p>
                  <p className="text-xs text-slate-500 mt-2">At your rate: you earn ≈ ${(q.taskerPayoutCents / 100).toFixed(2)}</p>
                  <div className="mt-3 flex gap-2">
                    <button disabled={busy === t.id} onClick={() => call(t.id, `/api/pro/tasks/${t.id}/invite`, { method: "POST", body: JSON.stringify({ action: "decline" }) }, "Request declined.")} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Decline</button>
                    <button disabled={busy === t.id} onClick={() => call(t.id, `/api/pro/tasks/${t.id}/invite`, { method: "POST", body: JSON.stringify({ action: "accept" }) }, "Task accepted!")} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">Accept</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className={h2}>My active tasks ({data.myTasks.length})</h2>
        {data.myTasks.length === 0 ? <p className="text-sm text-slate-500">Nothing scheduled.</p> : (
          <div className="space-y-3">
            {data.myTasks.map((t: any) => (
              <div key={t.id} className={card}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{t.title}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusStyle[t.status]}`}>{t.status}</span>
                </div>
                <TaskMeta task={t} />
                <p className="text-sm text-slate-700 mt-2">{t.description}</p>
                <p className="text-xs text-slate-500 mt-2">Customer: {t.customer.name} • You earn ≈ ${((t.taskerPayoutCents || 0) / 100).toFixed(2)}</p>
                <div className="mt-3">
                  {t.status === "ASSIGNED" && (
                    <button disabled={busy === t.id} onClick={() => call(t.id, `/api/tasks/${t.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "IN_PROGRESS" }) }, "Task started.")} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Start task</button>
                  )}
                  {t.status === "IN_PROGRESS" && (
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={12} step={0.5} value={hours[t.id] ?? String(t.estimatedHours)} onChange={(e) => setHours({ ...hours, [t.id]: e.target.value })} className="w-20 border border-slate-200 rounded-xl px-2 py-1.5 text-xs" aria-label="Actual hours worked" />
                      <span className="text-xs text-slate-500">hours worked</span>
                      <button disabled={busy === t.id} onClick={() => call(t.id, `/api/tasks/${t.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED", actualHours: Number(hours[t.id] ?? t.estimatedHours) }) }, "Task completed. Payout sent!")} className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700">Complete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.myOffers.length > 0 && (
        <section>
          <h2 className={h2}>My pending offers ({data.myOffers.length})</h2>
          <div className="space-y-3">
            {data.myOffers.map((o: any) => (
              <div key={o.id} className={`${card} flex items-center justify-between gap-3`}>
                <div>
                  <h3 className="font-bold text-slate-900">{o.task.title}</h3>
                  <p className="text-xs text-slate-500">You offered ${(o.hourlyRateCents / 100).toFixed(0)}/hr</p>
                </div>
                <button disabled={busy === o.id} onClick={() => call(o.id, `/api/pro/tasks/${o.taskId}/offer`, { method: "DELETE" }, "Offer withdrawn.")} className="text-xs font-bold text-red-600">Withdraw</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className={h2}>Open tasks near you ({data.openTasks.length})</h2>
        {data.openTasks.length === 0 ? <p className="text-sm text-slate-500">No open tasks match your skills and ZIPs right now.</p> : (
          <div className="space-y-3">
            {data.openTasks.map((t: any) => (
              <div key={t.id} className={card}>
                <h3 className="font-bold text-slate-900">{t.title}</h3>
                <TaskMeta task={t} />
                <p className="text-sm text-slate-700 mt-2">{t.description}</p>
                {bid && bid.taskId === t.id ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">$</span>
                      <input type="number" min={15} max={500} value={bid.rate / 100} onChange={(e) => setBid({ ...bid, rate: Math.round(Number(e.target.value) * 100) })} className="w-24 border border-slate-200 rounded-xl px-2 py-1.5 text-sm" aria-label="Hourly rate" />
                      <span className="text-xs text-slate-500">/hr • you earn ≈ ${(calculateTaskPrice(bid.rate, t.estimatedHours).taskerPayoutCents / 100).toFixed(2)}</span>
                    </div>
                    <textarea rows={3} value={bid.message} onChange={(e) => setBid({ ...bid, message: e.target.value })} placeholder="Why are you a great fit? Mention tools, experience, availability." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => setBid(null)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                      <button disabled={busy === t.id} onClick={() => call(t.id, `/api/pro/tasks/${t.id}/offer`, { method: "POST", body: JSON.stringify({ hourlyRateCents: bid.rate, message: bid.message }) }, "Offer sent!")} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">Send offer</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setBid({ taskId: t.id, rate: data.profile.hourlyRateCents, message: "" })} className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">Make an offer</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
