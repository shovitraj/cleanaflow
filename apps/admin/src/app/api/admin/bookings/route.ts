export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Role } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status: status as any } : {})
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        cleaner: { select: { id: true, name: true, email: true } },
        address: true,
        payments: true,
        disputes: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
