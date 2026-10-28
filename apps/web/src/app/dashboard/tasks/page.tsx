"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, MapPin, Calendar } from "lucide-react";
import { categoryLabel } from "@cleanaglow/types";
import { useAuth } from "@/hooks/useAuth";
import { statusStyle } from "@/components/tasks/status";

export default function MyTasksPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/tasks").then((r) => r.json()).then((d) => setTasks(d.tasks || [])).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Tasks</h1>
        <div className="flex gap-2">
          <Link href="/taskers" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">Browse Taskers</Link>
          <Link href="/dashboard/tasks/new" className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Post a task</Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          No tasks yet. Post one and Taskers near you will send offers.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Link key={t.id} href={`/dashboard/tasks/${t.id}`} className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-300 transition">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{t.title}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusStyle[t.status]}`}>{t.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                    <span>{categoryLabel(t.category)}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(t.scheduledAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t.city}, {t.zip}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {t.status === "OPEN" ? `${t._count.offers} offer${t._count.offers === 1 ? "" : "s"}` : t.tasker?.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
