"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { TaskerCard, TaskerSummary } from "@/components/tasks/TaskerCard";

export default function TaskerProfilePage({ params }: { params: { id: string } }) {
  const [tasker, setTasker] = useState<TaskerSummary | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/taskers/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setTasker(d.tasker);
          setReviews(d.reviews);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  if (!tasker) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-slate-600 mb-4">This Tasker isn't available.</p>
        <Link href="/taskers" className="text-teal-700 font-bold text-sm">Browse Taskers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <Link href="/taskers" className="text-xs font-bold text-teal-700">&larr; All Taskers</Link>
      <TaskerCard tasker={tasker} />
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{r.authorName}</span>
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                    {r.rating} <Star className="w-3.5 h-3.5 fill-amber-500" />
                  </span>
                </div>
                {r.body && <p className="text-sm text-slate-600 mt-1">{r.body}</p>}
                <p className="text-[11px] text-slate-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
