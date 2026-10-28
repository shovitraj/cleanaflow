import Link from "next/link";
import { Star, ShieldCheck, Truck, Award } from "lucide-react";
import { TASK_CATEGORIES, isTaskCategory } from "@cleanaglow/types";

export interface TaskerSummary {
  id: string;
  name: string | null;
  cleanerProfile: {
    headline: string | null;
    bio: string | null;
    skills: string;
    hourlyRateCents: number;
    hasVehicle: boolean;
    tasksCompleted: number;
    isElite: boolean;
    rating: number;
    reviewCount: number;
  } | null;
}

export function skillLabels(skills: string) {
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(isTaskCategory)
    .map((s) => TASK_CATEGORIES[s].label);
}

export function TaskerCard({ tasker, category }: { tasker: TaskerSummary; category?: string }) {
  const p = tasker.cleanerProfile;
  if (!p) return null;
  const hireHref = `/dashboard/tasks/new?taskerId=${tasker.id}${category ? `&category=${category}` : ""}`;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-teal-300 transition">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center">
              {(tasker.name || "T").charAt(0)}
            </div>
            <div>
              <Link href={`/taskers/${tasker.id}`} className="font-bold text-slate-900 hover:text-teal-700">
                {tasker.name}
              </Link>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{p.rating.toFixed(2)}</span>
                <span>({p.reviewCount})</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold text-slate-900">${(p.hourlyRateCents / 100).toFixed(0)}</span>
            <span className="text-xs text-slate-500">/hr</span>
          </div>
        </div>

        {p.headline && <p className="mt-3 text-sm font-medium text-slate-800">{p.headline}</p>}
        {p.bio && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{p.bio}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {skillLabels(p.skills).map((s) => (
            <span key={s} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-teal-600" />{p.tasksCompleted} tasks</span>
          {p.hasVehicle && <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-teal-600" />Has vehicle</span>}
          {p.isElite && <span className="flex items-center gap-1 text-amber-700 font-semibold"><Award className="w-3.5 h-3.5" />Elite</span>}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Link href={`/taskers/${tasker.id}`} className="flex-1 text-center px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
          View profile
        </Link>
        <Link href={hireHref} className="flex-1 text-center px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition">
          Select &amp; Continue
        </Link>
      </div>
    </div>
  );
}
