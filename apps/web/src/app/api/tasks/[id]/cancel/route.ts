import { NextResponse } from "next/server";
import { prisma, TaskStatus, TaskOfferStatus } from "@cleanaglow/db";
import { getSessionUser, notify } from "@/lib/tasks";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (task.customerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (task.status !== TaskStatus.OPEN && task.status !== TaskStatus.ASSIGNED) {
      return NextResponse.json({ error: "This task can no longer be canceled." }, { status: 409 });
    }

    // Late cancel of an assigned task (<24h) incurs a fee on the customer's total.
    const hoursUntil = (task.scheduledAt.getTime() - Date.now()) / 3_600_000;
    const feeApplied = task.status === TaskStatus.ASSIGNED && hoursUntil < 24;

    await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: task.id }, data: { status: TaskStatus.CANCELED } });
      await tx.taskOffer.updateMany({
        where: { taskId: task.id, status: TaskOfferStatus.PENDING },
        data: { status: TaskOfferStatus.DECLINED }
      });
      if (feeApplied && task.subtotalCents) {
        const feeCents = Math.round(task.subtotalCents * 0.5);
        await tx.payment.updateMany({
          where: { taskId: task.id },
          data: { amountCents: feeCents }
        });
      } else {
        await tx.payment.updateMany({ where: { taskId: task.id }, data: { status: "REFUNDED" } });
      }
    });

    if (task.taskerId) {
      await notify(task.taskerId, "TASK_CANCELED", "Task canceled", `"${task.title}" was canceled by the customer.`, "/pro/tasks");
    }
    return NextResponse.json({ success: true, feeApplied });
  } catch (error) {
    console.error("Cancel task error:", error);
    return NextResponse.json({ error: "Failed to cancel task" }, { status: 500 });
  }
}
