import { NextResponse } from "next/server";
import { prisma, TaskStatus, TaskOfferStatus } from "@cleanaglow/db";
import { getSessionUser, notify, parseList } from "@/lib/tasks";

// Tasker submits (or updates) a bid on an open task.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.cleanerProfile.findUnique({ where: { userId: user.id } });
    if (!profile || !profile.isActive) return NextResponse.json({ error: "Tasker profile inactive." }, { status: 403 });

    const { hourlyRateCents, message } = await req.json();
    const rate = Math.round(Number(hourlyRateCents));
    if (!Number.isFinite(rate) || rate < 1500 || rate > 50_000) {
      return NextResponse.json({ error: "Hourly rate must be between $15 and $500." }, { status: 400 });
    }
    if (!String(message || "").trim()) {
      return NextResponse.json({ error: "Tell the customer why you're a great fit." }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task || task.status !== TaskStatus.OPEN) {
      return NextResponse.json({ error: "This task is no longer open." }, { status: 409 });
    }
    if (task.invitedTaskerId && task.invitedTaskerId !== user.id) {
      return NextResponse.json({ error: "This task was requested for another Tasker." }, { status: 403 });
    }
    if (!parseList(profile.skills).includes(task.category) || !parseList(profile.serviceZipCodes).includes(task.zip)) {
      return NextResponse.json({ error: "This task is outside your skills or service area." }, { status: 403 });
    }

    const offer = await prisma.taskOffer.upsert({
      where: { taskId_taskerId: { taskId: task.id, taskerId: user.id } },
      update: { hourlyRateCents: rate, message: String(message).trim(), status: TaskOfferStatus.PENDING },
      create: { taskId: task.id, taskerId: user.id, hourlyRateCents: rate, message: String(message).trim() }
    });

    await notify(task.customerId, "NEW_TASK_OFFER", "New offer on your task", `${user.name || "A Tasker"} offered $${(rate / 100).toFixed(2)}/hr for "${task.title}".`, `/dashboard/tasks/${task.id}`);
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error("Offer error:", error);
    return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.taskOffer.updateMany({
      where: { taskId: params.id, taskerId: user.id, status: TaskOfferStatus.PENDING },
      data: { status: TaskOfferStatus.WITHDRAWN }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to withdraw offer" }, { status: 500 });
  }
}
