"use client";

import { Check } from "lucide-react";

interface FunnelProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: "ZIP Code" },
  { step: 2, label: "Home Specs" },
  { step: 3, label: "Add-Ons" },
  { step: 4, label: "Select Plan" },
  { step: 5, label: "Checkout" }
];

export function FunnelProgressBar({ currentStep, onStepClick }: FunnelProgressBarProps) {
  return (
    <div className="w-full py-4 mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((s, idx) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div key={s.step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isCompleted}
                  onClick={() => isCompleted && onStepClick && onStepClick(s.step)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? "bg-teal-600 text-white cursor-pointer hover:bg-teal-700"
                      : isCurrent
                      ? "bg-teal-600 text-white ring-4 ring-teal-100"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                </button>
                <span
                  className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                    isCurrent ? "text-teal-700 font-semibold" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition ${
                    s.step < currentStep ? "bg-teal-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
