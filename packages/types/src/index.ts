export * from "./pricing";
export * from "./notifications";
export * from "./email";

export type UserRole = "CUSTOMER" | "CLEANER" | "ADMIN";
export type SubscriptionPlan = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "DISPUTED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING" | "PAID" | "FAILED";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED";
