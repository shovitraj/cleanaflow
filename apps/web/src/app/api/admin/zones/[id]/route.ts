import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { basePriceCents, isActive, city, state } = body;

    const updated = await prisma.serviceZone.update({
      where: { id },
      data: {
        ...(basePriceCents !== undefined && { basePriceCents: Number(basePriceCents) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(city && { city }),
        ...(state && { state })
      }
    });

    return NextResponse.json({ success: true, zone: updated });
  } catch (error) {
    console.error("Admin zone update error:", error);
    return NextResponse.json({ error: "Failed to update service zone" }, { status: 500 });
  }
}
