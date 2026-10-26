import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@cleanaglow/db";

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
    const { scheduledAt } = await req.json();

    if (!scheduledAt) {
      return NextResponse.json({ error: "New scheduledAt date is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.customerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        scheduledAt: new Date(scheduledAt)
      }
    });

    if (booking.cleanerId) {
      await prisma.notification.create({
        data: {
          userId: booking.cleanerId,
          type: "BOOKING_CONFIRMED",
          title: "Booking Rescheduled",
          body: `Booking has been rescheduled to ${new Date(scheduledAt).toLocaleDateString()}`,
          link: "/pro/calendar"
        }
      });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }
}
