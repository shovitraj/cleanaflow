import { NextResponse } from "next/server";
import { prisma, TaskStatus } from "@cleanaglow/db";
import { getSessionUser } from "@/lib/tasks";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rating, body } = await req.json();
    const stars = Math.round(Number(rating));
    if (!(stars >= 1 && stars <= 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id }, include: { review: true } });
    if (!task || task.customerId !== user.id || !task.taskerId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== TaskStatus.COMPLETED) {
      return NextResponse.json({ error: "You can review after the task is completed." }, { status: 409 });
    }
    if (task.review) {
      return NextResponse.json({ error: "You already reviewed this task." }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: { taskId: task.id, authorId: user.id, targetId: task.taskerId, rating: stars, body: String(body || "") }
    });

    const agg = await prisma.review.aggregate({
      where: { targetId: task.taskerId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await prisma.cleanerProfile.update({
      where: { userId: task.taskerId },
      data: { rating: Number((agg._avg.rating ?? stars).toFixed(2)), reviewCount: agg._count.rating }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Task review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
