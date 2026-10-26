export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, BookingStatus, SubscriptionStatus, Role } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalBookings,
      activeSubscriptions,
      totalCleaners,
      totalCustomers,
      openDisputes,
      allCompletedBookings
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.user.count({ where: { role: Role.CLEANER } }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.booking.findMany({
        where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED] } },
        select: { totalAmountCents: true, platformFeeCents: true }
      })
    ]);

    const gmvCents = allCompletedBookings.reduce((sum, b) => sum + b.totalAmountCents, 0);
    const revenueCents = allCompletedBookings.reduce((sum, b) => sum + b.platformFeeCents, 0);

    return NextResponse.json({
      metrics: {
        gmvCents,
        revenueCents,
        totalBookings,
        activeSubscriptions,
        totalCleaners,
        totalCustomers,
        openDisputes
      }
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
