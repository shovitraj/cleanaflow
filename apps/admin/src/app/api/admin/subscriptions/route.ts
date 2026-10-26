export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Role, SubscriptionStatus } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        bookings: { select: { id: true, scheduledAt: true, status: true }, take: 3 }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, status } = await req.json();

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: status as SubscriptionStatus }
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Admin subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
