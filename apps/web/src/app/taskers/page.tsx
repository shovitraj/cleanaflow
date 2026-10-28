"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS } from "@cleanaglow/types";
import { TaskerCard, TaskerSummary } from "@/components/tasks/TaskerCard";

function TaskersContent() {
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [zip, setZip] = useState(params.get("zip") || "");
  const [sort, setSort] = useState("rating");
  const [vehicle, setVehicle] = useState(false);
  const [taskers, setTaskers] = useState<TaskerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (zip.length === 5) q.set("zip", zip);
    q.set("sort", sort);
    if (vehicle) q.set("vehicle", "1");
    fetch(`/api/taskers?${q}`)
      .then((r) => r.json())
      .then((d) => setTaskers(d.taskers || []))
      .catch(() => setTaskers([]))
      .finally(() => setLoading(false));
  }, [category, zip, sort, vehicle]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Browse Taskers</h1>
          <p className="text-sm text-slate-500 mt-1">Pick a skilled, reviewed local pro and book them directly.</p>
        </div>
        <Link href="/dashboard/tasks/new" className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition self-start">
          Post a task instead
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <option value="">All categories</option>
          {TASK_CATEGORY_KEYS.map((k) => <option key={k} value={k}>{TASK_CATEGORIES[k].label}</option>)}
        </select>
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={zip} maxLength={5} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="ZIP code" className="w-full py-2 text-sm focus:outline-none" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <option value="rating">Top rated</option>
          <option value="price">Lowest price</option>
          <option value="tasks">Most tasks</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700 px-2">
          <input type="checkbox" checked={vehicle} onChange={(e) => setVehicle(e.target.checked)} /> Has a vehicle
        </label>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : taskers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          No Taskers match those filters. Try a different category or ZIP, or post a task and let Taskers come to you.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskers.map((t) => <TaskerCard key={t.id} tasker={t} category={category} />)}
        </div>
      )}
    </div>
  );
}

export default function TaskersPage() {
  return (
    <Suspense fallback={null}>
      <TaskersContent />
    </Suspense>
  );
}
