"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingFunnel } from "@/hooks/useBookingFunnel";
import { FunnelProgressBar } from "@/components/booking/FunnelProgressBar";
import {
  MapPin,
  Sparkles,
  Bed,
  Bath,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Calendar,
  Lock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState, nextStep, prevStep, goToStep, isLoaded } = useBookingFunnel();
  const { session, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check URL params on mount
  useEffect(() => {
    const zipParam = searchParams.get("zip");
    const planParam = searchParams.get("plan");

    if (zipParam && zipParam.length >= 5) {
      checkZipCode(zipParam);
    }
    if (planParam) {
      updateState({ plan: planParam as any });
    }
  }, [searchParams]);

  const checkZipCode = async (zip: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/zones/check?zip=${encodeURIComponent(zip)}`);
      const data = await res.json();

      if (data.available) {
        updateState({
          zipCode: zip,
          isZoneAvailable: true,
          zoneCity: data.city,
          zoneState: data.state,
          basePriceCents: data.basePriceCents
        });
      } else {
        updateState({
          zipCode: zip,
          isZoneAvailable: false
        });
        setError(data.message || "We do not service this ZIP code yet.");
      }
    } catch (err) {
      setError("Failed to check ZIP code availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.zipCode || state.zipCode.length < 5) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }
    await checkZipCode(state.zipCode);
    if (state.isZoneAvailable || (!error && state.zipCode)) {
      nextStep();
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/book")}`);
      return;
    }

    if (!state.street || !state.scheduledAt) {
      setError("Please provide your service address and desired cleaning date.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: state.paymentMethodId,
          plan: state.plan,
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          sqft: state.sqft,
          addOns: state.addOns,
          zipCode: state.zipCode,
          street: state.street,
          city: state.zoneCity || "New York",
          state: state.zoneState || "NY",
          scheduledAt: `${state.scheduledAt}T${state.timeSlot || "09:00"}:00.000Z`,
          notes: state.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      // Success: redirect to customer dashboard
      router.push("/dashboard?booking=new");
    } catch (err: any) {
      setError(err.message || "Failed to process booking. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <FunnelProgressBar currentStep={state.step} onStepClick={goToStep} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-6 sm:p-10">
        {/* Step 1: ZIP Code */}
        {state.step === 1 && (
          <div className="max-w-xl mx-auto text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Where do you need cleaning?
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              We match you with top-rated local cleaners in your exact neighborhood.
            </p>

            <form onSubmit={handleStep1Submit} className="mt-8 space-y-4">
              <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-teal-500 rounded-2xl p-2 bg-slate-50 transition">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                <input
                  type="text"
                  maxLength={5}
                  value={state.zipCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    updateState({ zipCode: val });
                    if (error) setError("");
                  }}
                  placeholder="Enter 5-digit ZIP (e.g. 10001)"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-lg font-medium"
                />
              </div>

              {state.zoneCity && (
                <div className="flex items-center justify-center gap-2 text-sm text-teal-700 font-semibold bg-teal-50 py-2.5 rounded-xl border border-teal-200">
                  <Check className="w-4 h-4" />
                  <span>Great news! We service {state.zoneCity}, {state.zoneState}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 py-2.5 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || state.zipCode.length < 5}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Home Specs */}
        {state.step === 2 && (
          <div className="max-w-xl mx-auto py-2">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Tell us about your home
            </h2>
            <p className="mt-1 text-slate-600 text-sm text-center mb-8">
              This helps us estimate clean duration and assign the best team.
            </p>

            <div className="space-y-6">
              {/* Bedrooms */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <Bed className="w-4 h-4 text-teal-600" />
                  <span>Bedrooms</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateState({ bedrooms: num })}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition ${
                        state.bedrooms === num
                          ? "border-teal-600 bg-teal-50 text-teal-800"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {num} {num === 6 ? "+" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <Bath className="w-4 h-4 text-teal-600" />
                  <span>Bathrooms</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateState({ bathrooms: num })}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition ${
                        state.bathrooms === num
                          ? "border-teal-600 bg-teal-50 text-teal-800"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {num} {num === 4 ? "+" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Square Footage */}
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">
                  Approximate Sq. Footage
                </label>
                <select
                  value={state.sqft}
                  onChange={(e) => updateState({ sqft: Number(e.target.value) })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-teal-500"
                >
                  <option value={750}>Under 1,000 sq ft</option>
                  <option value={1250}>1,000 – 1,500 sq ft</option>
                  <option value={1800}>1,500 – 2,200 sq ft</option>
                  <option value={2500}>2,200 – 3,000 sq ft</option>
                  <option value={3500}>3,000+ sq ft</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                >
                  <span>Next: Add-ons</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add-Ons */}
        {state.step === 3 && (
          <div className="max-w-xl mx-auto py-2">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Special Deep Clean Add-Ons
            </h2>
            <p className="mt-1 text-slate-600 text-sm text-center mb-8">
              Select any extra services you need for your clean.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "fridge", title: "Inside Refrigerator", price: "$35", desc: "Thorough scrub and shelf sanitize" },
                { key: "oven", title: "Inside Oven", price: "$35", desc: "Deep degrease and baked-on residue removal" },
                { key: "windows", title: "Interior Windows", price: "$40", desc: "Streak-free shine on inside window glass" },
                { key: "laundry", title: "Wash & Fold Laundry", price: "$30", desc: "Up to 2 loads washed, dried & folded" }
              ].map((item) => {
                const isSelected = !!state.addOns[item.key as keyof typeof state.addOns];
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      updateState({
                        addOns: {
                          ...state.addOns,
                          [item.key]: !isSelected
                        }
                      });
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        <span className="font-extrabold text-teal-700 text-xs bg-teal-100 px-2 py-0.5 rounded-full">
                          +{item.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition ${
                          isSelected ? "bg-teal-600 text-white" : "border border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
              >
                <span>Next: Choose Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Plan Select */}
        {state.step === 4 && (
          <div className="max-w-2xl mx-auto py-2">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Choose your cleaning plan
            </h2>
            <p className="mt-1 text-slate-600 text-sm text-center mb-8">
              Subscriptions include priority scheduling, dedicated cleaners, and big discounts.
            </p>

            <div className="space-y-4">
              {[
                {
                  id: "WEEKLY",
                  name: "Weekly Clean",
                  tag: "Best Value • 30% Off First Clean",
                  discount: "30% off 1st clean",
                  desc: "Same cleaner every week for maximum consistency"
                },
                {
                  id: "BIWEEKLY",
                  name: "Bi-Weekly Clean",
                  tag: "Most Popular • 20% Off First Clean",
                  discount: "20% off 1st clean",
                  desc: "Every 2 weeks maintenance for fresh living"
                },
                {
                  id: "MONTHLY",
                  name: "Monthly Clean",
                  tag: "10% Off First Clean",
                  discount: "10% off 1st clean",
                  desc: "Deep monthly refresh for peaceful home"
                },
                {
                  id: "ONE_TIME",
                  name: "One-Time Clean",
                  tag: "Standard Rate",
                  discount: "No subscription commitment",
                  desc: "Single deep clean without recurring billing"
                }
              ].map((plan) => {
                const isSelected = state.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => updateState({ plan: plan.id as any })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{plan.name}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {plan.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900">
                        ${(state.breakdown.firstCleanTotalCents / 100).toFixed(2)}
                      </div>
                      <span className="text-xs text-teal-700 font-semibold">{plan.discount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown Summary */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Base Home Clean ({state.bedrooms} bed, {state.bathrooms} bath):</span>
                <span className="font-semibold text-slate-800">
                  ${((state.breakdown.basePriceCents + state.breakdown.bedroomPriceCents + state.breakdown.bathroomPriceCents) / 100).toFixed(2)}
                </span>
              </div>
              {state.breakdown.addOnTotalCents > 0 && (
                <div className="flex justify-between">
                  <span>Selected Add-Ons:</span>
                  <span className="font-semibold text-slate-800">
                    +${(state.breakdown.addOnTotalCents / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {state.breakdown.discountCents > 0 && (
                <div className="flex justify-between text-teal-700 font-semibold">
                  <span>{state.plan} Plan Discount ({state.breakdown.discountPercent}% off):</span>
                  <span>-${(state.breakdown.discountCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Due Today:</span>
                <span className="text-teal-700 font-extrabold">
                  ${(state.breakdown.firstCleanTotalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
              >
                <span>Next: Schedule & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Checkout */}
        {state.step === 5 && (
          <div className="max-w-2xl mx-auto py-2">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              Schedule & Complete Booking
            </h2>
            <p className="mt-1 text-slate-600 text-sm text-center mb-8">
              Pick your first clean date and enter your address to finalize.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              {/* Date & Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    First Clean Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    value={state.scheduledAt}
                    onChange={(e) => updateState({ scheduledAt: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Arrival Time Window
                  </label>
                  <select
                    value={state.timeSlot}
                    onChange={(e) => updateState({ timeSlot: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-teal-500 text-sm"
                  >
                    <option value="08:00">Morning (8:00 AM – 11:00 AM)</option>
                    <option value="11:00">Midday (11:00 AM – 2:00 PM)</option>
                    <option value="14:00">Afternoon (2:00 PM – 5:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Service Address */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Street Address & Apt / Suite
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Main St, Apt 4B"
                  value={state.street}
                  onChange={(e) => updateState({ street: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-teal-500 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  ZIP: {state.zipCode} • City: {state.zoneCity || "New York"}, {state.zoneState || "NY"}
                </p>
              </div>

              {/* Entry & Cleaning Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Entry Instructions / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lockbox code #1234, cat in bedroom, focus on kitchen floor"
                  value={state.notes}
                  onChange={(e) => updateState({ notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-teal-500 text-sm"
                />
              </div>

              {/* Secure Payment Card Section */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-teal-700" />
                    <span className="text-sm font-bold text-teal-900">Secure Stripe Checkout</span>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                    256-Bit SSL Encrypted
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-teal-100 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-mono">•••• •••• •••• 4242 (Test Card)</span>
                  <span className="text-teal-700 font-bold">Stripe Ready</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm & Pay ${(state.breakdown.firstCleanTotalCents / 100).toFixed(2)}</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>}>
      <BookingContent />
    </Suspense>
  );
}
