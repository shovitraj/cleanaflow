import { NextResponse } from "next/server";
import { prisma, BookingStatus } from "@cleanaglow/db";
import { sendTransactionalEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Invalid cron secret" }, { status: 401 });
    }

    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find confirmed bookings scheduled for tomorrow
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        scheduledAt: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        }
      },
      include: {
        customer: true,
        cleaner: true
      }
    });

    let remindersSent = 0;

    for (const booking of upcomingBookings) {
      // Create in-app reminder notification
      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          type: "BOOKING_REMINDER_24H",
          title: "Clean Reminder",
          body: `Reminder: Your clean is scheduled for tomorrow at ${new Date(booking.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
          link: "/dashboard"
        }
      });

      // Send email reminder
      if (booking.customer.email) {
        await sendTransactionalEmail({
          to: booking.customer.email,
          template: "BOOKING_REMINDER_24H",
          subject: "Your CleanAglow clean is tomorrow!",
          data: {
            customerName: booking.customer.name,
            date: new Date(booking.scheduledAt).toLocaleDateString(),
            time: new Date(booking.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        });
        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: upcomingBookings.length,
      remindersSent
    });
  } catch (error) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
