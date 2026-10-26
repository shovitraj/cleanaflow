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

    const cleaner = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { cleanerProfile: true }
    });

    if (!cleaner || !cleaner.cleanerProfile) {
      return NextResponse.json({ error: "Cleaner profile not found" }, { status: 404 });
    }

    const rawZips = cleaner.cleanerProfile.serviceZipCodes || "";
    const zips = typeof rawZips === "string" ? rawZips.split(",").map((s) => s.trim()).filter(Boolean) : [];

    // Find pending unassigned jobs in matching service zip codes
    const availableJobs = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        cleanerId: null,
        scheduledAt: { gte: new Date() },
        ...(zips.length > 0
          ? {
              address: {
                zip: { in: zips }
              }
            }
          : {})
      },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        address: true,
        homeProfile: true
      },
      orderBy: { scheduledAt: "asc" }
    });

    // Also get cleaner's currently active assigned jobs
    const myActiveJobs = await prisma.booking.findMany({
      where: {
        cleanerId: session.user.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] }
      },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        address: true,
        homeProfile: true
      },
      orderBy: { scheduledAt: "asc" }
    });

    return NextResponse.json({
      availableJobs,
      myActiveJobs,
      serviceZipCodes: zips,
      onboardingComplete: cleaner.cleanerProfile.onboardingComplete
    });
  } catch (error) {
    console.error("Fetch pro jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
