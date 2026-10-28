export const TASK_CATEGORIES = {
  HOME_CLEANING: { label: "Home Cleaning", defaultRateCents: 4000 },
  FURNITURE_ASSEMBLY: { label: "Furniture Assembly", defaultRateCents: 5000 },
  MOUNTING: { label: "Mounting & Installation", defaultRateCents: 5500 },
  MOVING_HELP: { label: "Moving Help", defaultRateCents: 6000 },
  HOME_REPAIRS: { label: "Home Repairs", defaultRateCents: 6500 },
  YARD_WORK: { label: "Yard Work", defaultRateCents: 4500 },
  DELIVERY: { label: "Delivery & Errands", defaultRateCents: 3500 },
  PAINTING: { label: "Painting", defaultRateCents: 6000 },
  HOME_ORGANIZING: { label: "Home Organizing", defaultRateCents: 4500 }
} as const;

export type TaskCategory = keyof typeof TASK_CATEGORIES;

export const TASK_CATEGORY_KEYS = Object.keys(TASK_CATEGORIES) as TaskCategory[];

export function isTaskCategory(value: unknown): value is TaskCategory {
  return typeof value === "string" && value in TASK_CATEGORIES;
}

export type TaskStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
export type TaskOfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

/** Customer-paid "Trust & Support" fee, added on top of the tasker's hourly subtotal. */
export const TRUST_FEE_RATE = 0.15;
/** Commission the platform retains from the tasker's subtotal. */
export const TASKER_COMMISSION_RATE = 0.1;
export const MIN_TASK_HOURS = 1;
export const MAX_TASK_HOURS = 12;

export interface TaskPriceBreakdown {
  hourlyRateCents: number;
  hours: number;
  subtotalCents: number;
  trustFeeCents: number;
  totalCents: number;
  taskerPayoutCents: number;
  platformRevenueCents: number;
}

export function clampTaskHours(hours: number): number {
  if (!Number.isFinite(hours)) return MIN_TASK_HOURS;
  return Math.min(MAX_TASK_HOURS, Math.max(MIN_TASK_HOURS, hours));
}

/** Price a task. Tips are paid in full to the tasker and are not part of this breakdown. */
export function calculateTaskPrice(hourlyRateCents: number, hours: number): TaskPriceBreakdown {
  const h = clampTaskHours(hours);
  const subtotalCents = Math.round(Math.max(0, hourlyRateCents) * h);
  const trustFeeCents = Math.round(subtotalCents * TRUST_FEE_RATE);
  const commissionCents = Math.round(subtotalCents * TASKER_COMMISSION_RATE);
  return {
    hourlyRateCents,
    hours: h,
    subtotalCents,
    trustFeeCents,
    totalCents: subtotalCents + trustFeeCents,
    taskerPayoutCents: subtotalCents - commissionCents,
    platformRevenueCents: trustFeeCents + commissionCents
  };
}

export function categoryLabel(category: string): string {
  return isTaskCategory(category) ? TASK_CATEGORIES[category].label : category;
}
