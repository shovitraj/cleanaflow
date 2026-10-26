export type EmailTemplate =
  | "WELCOME"
  | "BOOKING_CONFIRMED"
  | "CLEANER_ASSIGNED"
  | "BOOKING_REMINDER_24H"
  | "PAYMENT_FAILED"
  | "PAYOUT_RECEIVED";

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  subject: string;
  data: Record<string, unknown>;
}
