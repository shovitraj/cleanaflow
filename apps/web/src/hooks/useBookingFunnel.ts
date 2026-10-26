"use client";

import { useState, useEffect } from "react";
import { PlanTier, AddOnSelection, PriceBreakdown, calculateEstimate } from "@cleanaglow/types";

export interface BookingFunnelState {
  step: number;
  zipCode: string;
  isZoneAvailable: boolean;
  zoneCity: string;
  zoneState: string;
  basePriceCents: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  addOns: AddOnSelection;
  plan: PlanTier;
  scheduledAt: string;
  timeSlot: string;
  street: string;
  notes: string;
  paymentMethodId: string;
  breakdown: PriceBreakdown;
}

const STORAGE_KEY = "cleanaglow_booking_funnel";

const INITIAL_STATE: BookingFunnelState = {
  step: 1,
  zipCode: "",
  isZoneAvailable: false,
  zoneCity: "",
  zoneState: "",
  basePriceCents: 12000,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 1000,
  addOns: {
    fridge: false,
    oven: false,
    windows: false,
    laundry: false
  },
  plan: "BIWEEKLY",
  scheduledAt: "",
  timeSlot: "09:00",
  street: "",
  notes: "",
  paymentMethodId: "pm_mock_card",
  breakdown: calculateEstimate({
    basePriceCents: 12000,
    bedrooms: 2,
    bathrooms: 1,
    plan: "BIWEEKLY",
    addOns: {}
  })
};

export function useBookingFunnel() {
  const [state, setState] = useState<BookingFunnelState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read funnel from sessionStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Could not write funnel to sessionStorage", e);
      }
    }
  }, [state, isLoaded]);

  // Re-calculate price breakdown whenever inputs change
  useEffect(() => {
    const updatedBreakdown = calculateEstimate({
      basePriceCents: state.basePriceCents || 12000,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      sqft: state.sqft,
      addOns: state.addOns,
      plan: state.plan
    });

    setState((prev) => ({
      ...prev,
      breakdown: updatedBreakdown
    }));
  }, [state.basePriceCents, state.bedrooms, state.bathrooms, state.sqft, state.addOns, state.plan]);

  const updateState = (updates: Partial<BookingFunnelState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setState((prev) => ({ ...prev, step: Math.min(5, prev.step + 1) }));
  const prevStep = () => setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  const goToStep = (stepNumber: number) => setState((prev) => ({ ...prev, step: stepNumber }));

  return {
    state,
    updateState,
    nextStep,
    prevStep,
    goToStep,
    isLoaded
  };
}
