import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Default fallback database url pointing to local dev.db
if (!process.env.DATABASE_URL) {
  const candidates = [
    path.resolve(__dirname, "../prisma/dev.db"),
    path.resolve(process.cwd(), "packages/db/prisma/dev.db"),
    path.resolve(process.cwd(), "../packages/db/prisma/dev.db"),
    path.resolve(process.cwd(), "../../packages/db/prisma/dev.db"),
    path.resolve(__dirname, "../../packages/db/prisma/dev.db")
  ];
  const found = candidates.find((p) => fs.existsSync(p)) || candidates[0];
  process.env.DATABASE_URL = `file:${found}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const Role = {
  CUSTOMER: "CUSTOMER",
  CLEANER: "CLEANER",
  ADMIN: "ADMIN"
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const SubscriptionPlan = {
  WEEKLY: "WEEKLY",
  BIWEEKLY: "BIWEEKLY",
  MONTHLY: "MONTHLY"
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CANCELED: "CANCELED"
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  DISPUTED: "DISPUTED"
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PayoutStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED"
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const DisputeStatus = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED"
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export * from "@prisma/client";
