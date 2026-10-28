"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS, calculateTaskPrice, isTaskCategory } from "@cleanaglow/types";
import { useAuth } from "@/hooks/useAuth";

function NewTaskContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const taskerId = params.get("taskerId");
  const initialCategory = params.get("category");

  const [category, setCategory] = useState(isTaskCategory(initialCategory) ? initialCategory : "FURNITURE_ASSEMBLY");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState(params.get("zip") || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [flexibleTiming, setFlexibleTiming] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [tasker, setTasker] = useState<any>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login?callbackUrl=/dashboard/tasks/new");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!taskerId) return;
    fetch(`/api/taskers/${taskerId}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setTasker(d.tasker));
  }, [taskerId]);

  const rate = tasker?.cleanerProfile?.hourlyRateCents ?? TASK_CATEGORIES[category].defaultRateCents;
  const quote = useMemo(() => calculateTaskPrice(rate, estimatedHours), [rate, estimatedHours]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description, street, city, state, zip, scheduledAt, flexibleTiming, estimatedHours, invitedTaskerId: taskerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post task");
      router.push(`/dashboard/tasks/${data.task.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        {tasker ? `Request ${tasker.name}` : "Post a task"}
      </h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        {tasker ? "They'll confirm if they're available." : "Describe what you need. Skilled Taskers nearby will send offers."}
      </p>

      <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700">What do you need help with?</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={input}>
            {TASK_CATEGORY_KEYS.map((k) => <option key={k} value={k}>{TASK_CATEGORIES[k].label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Task title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assemble IKEA wardrobe" className={input} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Details</label>
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Size, tools needed, parking, anything the Tasker should know." className={input} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-700">Street address</label><input required value={street} onChange={(e) => setStreet(e.target.value)} className={input} /></div>
          <div><label className="text-xs font-bold text-slate-700">City</label><input required value={city} onChange={(e) => setCity(e.target.value)} className={input} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-700">State</label><input required maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className={input} /></div>
            <div><label className="text-xs font-bold text-slate-700">ZIP</label><input required maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} className={input} /></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-xs font-bold text-slate-700">Date &amp; time</label><input required type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={input} /></div>
          <div>
            <label className="text-xs font-bold text-slate-700">Estimated hours</label>
            <input type="number" min={1} max={12} step={0.5} value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} className={input} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={flexibleTiming} onChange={(e) => setFlexibleTiming(e.target.checked)} /> I'm flexible on timing
        </label>

        <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-1">
          <div className="flex justify-between"><span>{tasker ? `${tasker.name}'s rate` : "Typical rate"}</span><span>${(rate / 100).toFixed(2)}/hr</span></div>
          <div className="flex justify-between"><span>Subtotal ({quote.hours} hr)</span><span>${(quote.subtotalCents / 100).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Trust &amp; Support fee</span><span>${(quote.trustFeeCents / 100).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t border-slate-200 pt-1"><span>Estimated total</span><span>${(quote.totalCents / 100).toFixed(2)}</span></div>
          {!tasker && <p className="text-[11px] text-slate-500">Final price is set by the offer you accept.</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {tasker ? "Send request" : "Post task"}
        </button>
      </form>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={null}>
      <NewTaskContent />
    </Suspense>
  );
}
