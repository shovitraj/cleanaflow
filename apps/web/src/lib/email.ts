import { Resend } from "resend";
import { SendEmailOptions } from "@cleanaglow/types";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_test_key");

export async function sendTransactionalEmail(options: SendEmailOptions) {
  const { to, template, subject, data } = options;

  const htmlContent = generateEmailHtml(template, data);

  try {
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_mock")) {
      await resend.emails.send({
        from: "CleanAglow <notifications@cleanaglow.com>",
        to,
        subject,
        html: htmlContent
      });
      console.log(`Email sent via Resend to ${to} (${template})`);
    } else {
      console.log(`[MOCK EMAIL] To: ${to} | Template: ${template} | Subject: ${subject}`);
    }
    return { success: true };
  } catch (err) {
    console.warn("Failed to send transactional email:", err);
    return { success: false, error: err };
  }
}

function generateEmailHtml(template: string, data: Record<string, any>): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  switch (template) {
    case "WELCOME":
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0d9488;">Welcome to CleanAglow! ✨</h2>
          <p>Hi ${data.name || "there"},</p>
          <p>Thank you for creating an account with CleanAglow. We're excited to help you maintain a fresh, sparkling clean home on autopilot.</p>
          <p><a href="${appUrl}/book" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Schedule Your First Clean</a></p>
        </div>
      `;

    case "BOOKING_CONFIRMED":
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0d9488;">Your Clean is Confirmed! 🧹</h2>
          <p>Hi ${data.customerName || "Customer"},</p>
          <p>Your upcoming cleaning booking is confirmed for <strong>${data.date}</strong> at <strong>${data.time}</strong>.</p>
          <p>Address: ${data.address}</p>
          <p>Total: $${data.total}</p>
          <p><a href="${appUrl}/dashboard" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">View in Dashboard</a></p>
        </div>
      `;

    case "CLEANER_ASSIGNED":
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0d9488;">Meet Your Cleaner! 🌟</h2>
          <p>Hi ${data.customerName || "Customer"},</p>
          <p>Great news! <strong>${data.cleanerName}</strong> has been assigned to your booking on ${data.date}.</p>
          <p><a href="${appUrl}/dashboard/messages" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Message Cleaner</a></p>
        </div>
      `;

    case "BOOKING_REMINDER_24H":
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0d9488;">Reminder: Clean Tomorrow! ⏰</h2>
          <p>Hi ${data.customerName || "Customer"},</p>
          <p>This is a quick reminder that your clean is scheduled for tomorrow, <strong>${data.date}</strong>.</p>
          <p>Please ensure entry instructions or lockbox details are up-to-date.</p>
        </div>
      `;

    default:
      return `<p>Hello from CleanAglow!</p>`;
  }
}
