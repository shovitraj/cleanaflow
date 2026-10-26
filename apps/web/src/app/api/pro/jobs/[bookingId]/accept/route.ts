import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, BookingStatus } from "@cleanaglow/db";

export async function POST(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = params;

    // Use Prisma transaction to atomically check and accept job
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (booking.cleanerId !== null || booking.status !== BookingStatus.PENDING) {
        throw new Error("JOB_ALREADY_ACCEPTED");
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          cleanerId: session.user.id,
          status: BookingStatus.CONFIRMED
        },
        include: {
          customer: true
        }
      });

      // Create conversation if not already existing
      await tx.conversation.upsert({
        where: {
          customerId_cleanerId: {
            customerId: updated.customerId,
            cleanerId: session.user.id
          }
        },
        update: { bookingId: updated.id },
        create: {
          customerId: updated.customerId,
          cleanerId: session.user.id,
          bookingId: updated.id
        }
      });

      // Create in-app notification for the customer
      await tx.notification.create({
        data: {
          userId: updated.customerId,
          type: "CLEANER_ASSIGNED",
          title: "Cleaner Assigned!",
          body: `${session.user.name || "A professional cleaner"} has accepted your booking for ${new Date(updated.scheduledAt).toLocaleDateString()}.`,
          link: "/dashboard"
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, booking: result });
  } catch (error: any) {
    if (error.message === "JOB_ALREADY_ACCEPTED") {
      return NextResponse.json(
        { error: "Another pro has already accepted this job." },
        { status: 409 }
      );
    }
    if (error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    console.error("Job acceptance error:", error);
    return NextResponse.json({ error: "Failed to accept job." }, { status: 500 });
  }
}
