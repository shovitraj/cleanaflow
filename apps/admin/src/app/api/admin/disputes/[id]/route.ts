import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Role, DisputeStatus } from "@cleanaglow/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const { status, resolution } = await req.json();

    const updated = await prisma.dispute.update({
      where: { id },
      data: {
        ...(status && { status: status as DisputeStatus }),
        ...(resolution !== undefined && { resolution })
      },
      include: {
        booking: true
      }
    });

    return NextResponse.json({ success: true, dispute: updated });
  } catch (error) {
    console.error("Admin dispute update error:", error);
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
