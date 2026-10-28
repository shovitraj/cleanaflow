import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";
import { PUBLIC_TASKER_SELECT } from "@/lib/tasks";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const tasker = await prisma.user.findFirst({
      where: { id: params.id, role: "CLEANER", cleanerProfile: { isActive: true } },
      select: PUBLIC_TASKER_SELECT
    });
    if (!tasker) return NextResponse.json({ error: "Tasker not found" }, { status: 404 });

    const reviews = await prisma.review.findMany({
      where: { targetId: params.id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return NextResponse.json({
      tasker,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        authorName: (r.author.name || "Customer").split(" ")[0]
      }))
    });
  } catch (error) {
    console.error("Tasker profile error:", error);
    return NextResponse.json({ error: "Failed to load Tasker" }, { status: 500 });
  }
}
