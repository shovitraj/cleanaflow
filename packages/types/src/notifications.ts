export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "CLEANER_ASSIGNED"
  | "BOOKING_REMINDER_24H"
  | "BOOKING_COMPLETED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYOUT_SENT"
  | "DISPUTE_UPDATED"
  | "NEW_MESSAGE"
  | "NEW_TASK_OFFER"
  | "TASK_OFFER_ACCEPTED"
  | "TASK_STATUS_UPDATED"
  | "TASK_COMPLETED"
  | "TASK_CANCELED";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}
