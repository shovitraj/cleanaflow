import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, BookingStatus } from "@cleanaglow/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, cleaner: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Permission check: customer, assigned cleaner, or admin
    const isOwner = booking.customerId === session.user.id;
    const isCleaner = booking.cleanerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isCleaner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = Date.now();
    const scheduledTime = new Date(booking.scheduledAt).getTime();
    const diffHours = (scheduledTime - now) / (1000 * 60 * 60);

    let feeChargedCents = 0;
    let feeApplied = false;

    // Apply 50% fee if canceled by customer less than 24 hours in advance
    if (isOwner && diffHours < 24 && diffHours > 0) {
      feeChargedCents = Math.round(booking.totalAmountCents * 0.5);
      feeApplied = true;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELED
      }
    });

    // Notify cleaner if assigned
    if (booking.cleanerId) {
      await prisma.notification.create({
        data: {
          userId: booking.cleanerId,
          type: "BOOKING_CONFIRMED",
          title: "Booking Canceled",
          body: `Booking for ${new Date(booking.scheduledAt).toLocaleDateString()} was canceled by the customer.`,
          link: "/pro/jobs"
        }
      });
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      feeApplied,
      feeChargedCents
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
