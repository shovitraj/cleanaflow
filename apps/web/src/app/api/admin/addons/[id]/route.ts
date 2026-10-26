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
    const { priceCents, durationMinutes } = body;

    const updated = await prisma.addOnPricing.update({
      where: { id },
      data: {
        ...(priceCents !== undefined && { priceCents: Number(priceCents) }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) })
      }
    });

    return NextResponse.json({ success: true, addOn: updated });
  } catch (error) {
    console.error("Admin add-on update error:", error);
    return NextResponse.json({ error: "Failed to update add-on pricing" }, { status: 500 });
  }
}
