import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, BookingStatus } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const bookings = await prisma.booking.findMany({
      where: {
        cleanerId: session.user.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED] },
        ...(start && end
          ? {
              scheduledAt: {
                gte: new Date(start),
                lte: new Date(end)
              }
            }
          : {})
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        address: true,
        homeProfile: true
      },
      orderBy: { scheduledAt: "asc" }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar bookings" }, { status: 500 });
  }
}
