import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        addresses: true,
        homeProfiles: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        customerBookings: {
          include: {
            cleaner: {
              include: { cleanerProfile: true }
            },
            address: true,
            homeProfile: true,
            review: true
          },
          orderBy: { scheduledAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      subscription: user.subscriptions[0] || null,
      bookings: user.customerBookings,
      address: user.addresses[0] || null,
      homeProfile: user.homeProfiles[0] || null
    });
  } catch (error) {
    console.error("Customer dashboard data error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
