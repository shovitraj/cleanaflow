"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS } from "@cleanaglow/types";
import { useAuth } from "@/hooks/useAuth";

export default function ProProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rate, setRate] = useState(45);
  const [zips, setZips] = useState("");
  const [years, setYears] = useState(0);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/pro/profile")
      .then((r) => r.json())
      .then(({ profile: p }) => {
        if (!p) return;
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setSkills(p.skills.split(",").map((s: string) => s.trim()).filter(Boolean));
        setRate(p.hourlyRateCents / 100);
        setZips(p.serviceZipCodes);
        setYears(p.yearsExperience);
        setHasVehicle(p.hasVehicle);
        setIsActive(p.isActive);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/pro/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, bio, skills, hourlyRateCents: Math.round(rate * 100), serviceZipCodes: zips, yearsExperience: years, hasVehicle, isActive })
    });
    const data = await res.json();
    setMsg(res.ok ? "Profile saved." : data.error || "Failed to save.");
    setSaving(false);
  };

  if (isLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;

  const input = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Tasker profile</h1>
      <form onSubmit={save} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div><label className="text-xs font-bold text-slate-700">Headline</label><input value={headline} maxLength={80} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Fast, tidy furniture assembly" className={input} /></div>
        <div><label className="text-xs font-bold text-slate-700">About you</label><textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={input} /></div>
        <div>
          <label className="text-xs font-bold text-slate-700">Skills</label>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TASK_CATEGORY_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={skills.includes(k)} onChange={(e) => setSkills(e.target.checked ? [...skills, k] : skills.filter((s) => s !== k))} />
                {TASK_CATEGORIES[k].label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="text-xs font-bold text-slate-700">Hourly rate ($)</label><input type="number" min={15} max={500} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={input} /></div>
          <div><label className="text-xs font-bold text-slate-700">Years of experience</label><input type="number" min={0} value={years} onChange={(e) => setYears(Number(e.target.value))} className={input} /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-slate-700 pb-2"><input type="checkbox" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)} />Have a vehicle</label></div>
        </div>
        <div><label className="text-xs font-bold text-slate-700">Service ZIP codes (comma separated)</label><input value={zips} onChange={(e) => setZips(e.target.value)} className={input} /></div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />Visible &amp; accepting tasks</label>
        {msg && <p className="text-sm text-teal-800">{msg}</p>}
        <button disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition">{saving ? "Saving..." : "Save profile"}</button>
      </form>
    </div>
  );
}
