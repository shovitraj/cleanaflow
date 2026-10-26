export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "CLEANER_ASSIGNED"
  | "BOOKING_REMINDER_24H"
  | "BOOKING_COMPLETED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYOUT_SENT"
  | "DISPUTE_UPDATED"
  | "NEW_MESSAGE";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}
