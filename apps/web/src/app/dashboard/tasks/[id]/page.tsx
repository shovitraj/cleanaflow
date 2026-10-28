"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Star, MessageSquare } from "lucide-react";
import { categoryLabel, calculateTaskPrice } from "@cleanaglow/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyle } from "@/components/tasks/status";
import { skillLabels } from "@/components/tasks/TaskerCard";

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [tip, setTip] = useState(5);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${params.id}`);
    if (res.ok) setTask((await res.json()).task);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const call = async (url: string, init: RequestInit, okMsg: string) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMsg(data.feeApplied ? "Canceled. A late-cancellation fee applies." : okMsg);
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  if (!task) return <div className="py-20 text-center text-slate-600">Task not found. <Link href="/dashboard/tasks" className="text-teal-700 font-bold">Back to tasks</Link></div>;

  const pending = (task.offers || []).filter((o: any) => o.status === "PENDING");
  const total = task.subtotalCents != null ? task.subtotalCents + (task.trustFeeCents || 0) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link href="/dashboard/tasks" className="text-xs font-bold text-teal-700">&larr; My Tasks</Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusStyle[task.status]}`}>{task.status}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {categoryLabel(task.category)} • {new Date(task.scheduledAt).toLocaleString()} • {task.street}, {task.city}, {task.state} {task.zip}
        </p>
        <p className="text-sm text-slate-700 mt-4 whitespace-pre-wrap">{task.description}</p>
        <p className="text-xs text-slate-500 mt-3">Est. {task.estimatedHours} hr{task.flexibleTiming ? " • flexible timing" : ""}</p>

        {total != null && (
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal @ ${(task.hourlyRateCents / 100).toFixed(2)}/hr</span><span>${(task.subtotalCents / 100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Trust &amp; Support fee</span><span>${(task.trustFeeCents / 100).toFixed(2)}</span></div>
            {task.tipCents > 0 && <div className="flex justify-between"><span>Tip</span><span>${(task.tipCents / 100).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold border-t border-slate-200 pt-1"><span>Total</span><span>${((total + task.tipCents) / 100).toFixed(2)}</span></div>
          </div>
        )}

        {(task.status === "OPEN" || task.status === "ASSIGNED") && (
          <button disabled={busy} onClick={() => confirm("Cancel this task? Late cancellations of assigned tasks (<24h) incur a 50% fee.") && call(`/api/tasks/${task.id}/cancel`, { method: "POST" }, "Task canceled.")} className="mt-4 text-xs font-bold text-red-600 hover:underline">
            Cancel task
          </button>
        )}
      </div>

      {msg && <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-900">{msg}</div>}

      {task.tasker && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Tasker</p>
            <Link href={`/taskers/${task.tasker.id}`} className="font-bold text-slate-900 hover:text-teal-700">{task.tasker.name}</Link>
            <p className="text-xs text-slate-500">★ {task.tasker.cleanerProfile?.rating.toFixed(2)} • {skillLabels(task.tasker.cleanerProfile?.skills || "").join(", ")}</p>
          </div>
          <Link href="/dashboard/messages" className="text-xs font-bold text-teal-700 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Message</Link>
        </div>
      )}

      {task.status === "OPEN" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1">{task.invitedTaskerId ? "Waiting for your requested Tasker" : `Offers (${pending.length})`}</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-slate-500">{task.invitedTaskerId ? "They'll respond soon. If they decline, your task opens to others." : "Taskers in your area have been notified. Offers will appear here."}</p>
          ) : (
            <div className="space-y-3 mt-3">
              {pending.map((o: any) => {
                const q = calculateTaskPrice(o.hourlyRateCents, task.estimatedHours);
                return (
                  <div key={o.id} className="border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/taskers/${o.tasker.id}`} className="font-bold text-slate-900 hover:text-teal-700">{o.tasker.name}</Link>
                        <p className="text-xs text-slate-500">★ {o.tasker.cleanerProfile?.rating.toFixed(2)} ({o.tasker.cleanerProfile?.reviewCount}) • {o.tasker.cleanerProfile?.tasksCompleted} tasks</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900">${(o.hourlyRateCents / 100).toFixed(0)}/hr</p>
                        <p className="text-[11px] text-slate-500">≈ ${(q.totalCents / 100).toFixed(2)} total</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{o.message}</p>
                    <button disabled={busy} onClick={() => call(`/api/tasks/${task.id}/offers/${o.id}/accept`, { method: "POST" }, "Tasker hired!")} className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition">
                      Hire {o.tasker.name?.split(" ")[0]}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {task.status === "COMPLETED" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          {!task.review ? (
            <div>
              <h2 className="font-bold text-slate-900 mb-2">Rate your Tasker</h2>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`w-6 h-6 ${n <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                  </button>
                ))}
              </div>
              <textarea rows={3} value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} placeholder="How did it go?" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <button disabled={busy} onClick={() => call(`/api/tasks/${task.id}/review`, { method: "POST", body: JSON.stringify({ rating, body: reviewBody }) }, "Thanks for the review!")} className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">
                Submit review
              </button>
            </div>
          ) : (
            <p className="text-sm text-amber-700 font-bold">You rated this task {task.review.rating}/5.</p>
          )}
          <div>
            <h2 className="font-bold text-slate-900 mb-2">Add a tip</h2>
            <div className="flex items-center gap-2">
              {[5, 10, 20].map((d) => (
                <button key={d} onClick={() => setTip(d)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${tip === d ? "bg-teal-600 text-white border-teal-600" : "border-slate-200 text-slate-700"}`}>${d}</button>
              ))}
              <button disabled={busy} onClick={() => call(`/api/tasks/${task.id}/tip`, { method: "POST", body: JSON.stringify({ amountCents: tip * 100 }) }, "Tip sent. Thank you!")} className="ml-2 px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
                Send tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
