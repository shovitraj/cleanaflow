import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, BookingStatus, PayoutStatus } from "@cleanaglow/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, cleaner: { include: { cleanerProfile: true } } }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAssignedCleaner = booking.cleanerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAssignedCleaner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus }
    });

    // If marked COMPLETED, auto-trigger cleaner payout
    if (status === "COMPLETED" && booking.cleanerId) {
      const existingPayout = await prisma.payout.findFirst({
        where: { bookingId: booking.id }
      });

      if (!existingPayout) {
        await prisma.payout.create({
          data: {
            bookingId: booking.id,
            cleanerId: booking.cleanerId,
            stripeTransferId: `tr_auto_${booking.id}_${Date.now()}`,
            amountCents: booking.cleanerPayoutCents,
            status: PayoutStatus.PAID,
            paidAt: new Date()
          }
        });

        // Notify customer to leave a review
        await prisma.notification.create({
          data: {
            userId: booking.customerId,
            type: "BOOKING_COMPLETED",
            title: "Your home is sparkling clean!",
            body: "Your booking is complete. How was your cleaner? Please leave a review.",
            link: "/dashboard"
          }
        });
      }
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Booking status update error:", error);
    return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
  }
}
