export type PlanTier = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "ONE_TIME";

export interface AddOnSelection {
  fridge?: boolean;
  oven?: boolean;
  windows?: boolean;
  laundry?: boolean;
}

export interface PricingInput {
  basePriceCents: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  addOns?: AddOnSelection;
  plan: PlanTier;
}

export interface PriceBreakdown {
  basePriceCents: number;
  bedroomPriceCents: number;
  bathroomPriceCents: number;
  addOnTotalCents: number;
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  firstCleanTotalCents: number;
  recurringCleanTotalCents: number;
  platformFeeCents: number;
  cleanerPayoutCents: number;
}

export const BED_RATE_CENTS = 2500; // $25 per bedroom
export const BATH_RATE_CENTS = 3000; // $30 per bathroom

export const ADDON_PRICING_CENTS: Record<keyof AddOnSelection, number> = {
  fridge: 3500,  // $35
  oven: 3500,    // $35
  windows: 4000, // $40
  laundry: 3000  // $30
};

export const PLAN_DISCOUNTS: Record<PlanTier, number> = {
  WEEKLY: 30,    // 30% off first clean
  BIWEEKLY: 20,  // 20% off first clean
  MONTHLY: 10,   // 10% off first clean
  ONE_TIME: 0    // 0% off
};

export const DEFAULT_COMMISSION_RATE = 0.30; // 30% platform fee

export function calculateEstimate(
  input: PricingInput,
  commissionRate: number = DEFAULT_COMMISSION_RATE
): PriceBreakdown {
  const bedroomPriceCents = Math.max(0, input.bedrooms) * BED_RATE_CENTS;
  const bathroomPriceCents = Math.max(0, input.bathrooms) * BATH_RATE_CENTS;

  let addOnTotalCents = 0;
  if (input.addOns) {
    if (input.addOns.fridge) addOnTotalCents += ADDON_PRICING_CENTS.fridge;
    if (input.addOns.oven) addOnTotalCents += ADDON_PRICING_CENTS.oven;
    if (input.addOns.windows) addOnTotalCents += ADDON_PRICING_CENTS.windows;
    if (input.addOns.laundry) addOnTotalCents += ADDON_PRICING_CENTS.laundry;
  }

  const subtotalCents =
    input.basePriceCents + bedroomPriceCents + bathroomPriceCents + addOnTotalCents;

  const discountPercent = PLAN_DISCOUNTS[input.plan] ?? 0;
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const firstCleanTotalCents = subtotalCents - discountCents;
  const recurringCleanTotalCents = subtotalCents;

  const platformFeeCents = Math.round(firstCleanTotalCents * commissionRate);
  const cleanerPayoutCents = firstCleanTotalCents - platformFeeCents;

  return {
    basePriceCents: input.basePriceCents,
    bedroomPriceCents,
    bathroomPriceCents,
    addOnTotalCents,
    subtotalCents,
    discountPercent,
    discountCents,
    firstCleanTotalCents,
    recurringCleanTotalCents,
    platformFeeCents,
    cleanerPayoutCents
  };
}
