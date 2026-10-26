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

    const disputes = await prisma.dispute.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        booking: {
          include: {
            cleaner: { select: { id: true, name: true, email: true } },
            payments: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Admin disputes error:", error);
    return NextResponse.json({ error: "Failed to load disputes" }, { status: 500 });
  }
}
