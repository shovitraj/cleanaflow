import { NextResponse } from "next/server";
import { prisma, TaskStatus, PayoutStatus } from "@cleanaglow/db";
import { calculateTaskPrice, clampTaskHours } from "@cleanaglow/types";
import { getSessionUser, notify } from "@/lib/tasks";

// Assigned tasker moves a task ASSIGNED -> IN_PROGRESS -> COMPLETED.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, actualHours } = await req.json();
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (task.taskerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed: Record<string, string> = {
      [TaskStatus.ASSIGNED]: TaskStatus.IN_PROGRESS,
      [TaskStatus.IN_PROGRESS]: TaskStatus.COMPLETED
    };
    if (allowed[task.status] !== status) {
      return NextResponse.json({ error: `Cannot move task from ${task.status} to ${status}.` }, { status: 409 });
    }

    if (status === TaskStatus.IN_PROGRESS) {
      await prisma.task.update({ where: { id: task.id }, data: { status } });
      await notify(task.customerId, "TASK_STATUS_UPDATED", "Your Tasker has started", `Work has begun on "${task.title}".`, `/dashboard/tasks/${task.id}`);
      return NextResponse.json({ success: true });
    }

    // COMPLETED: bill actual hours if provided (within bounds), then pay out the tasker.
    const hours = actualHours !== undefined ? clampTaskHours(Number(actualHours)) : task.estimatedHours;
    const rate = task.hourlyRateCents ?? 0;
    const quote = calculateTaskPrice(rate, hours);

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          actualHours: hours,
          subtotalCents: quote.subtotalCents,
          trustFeeCents: quote.trustFeeCents,
          taskerPayoutCents: quote.taskerPayoutCents
        }
      });
      await tx.payment.updateMany({
        where: { taskId: task.id },
        data: { amountCents: quote.totalCents, status: "SUCCEEDED" }
      });
      if (task.taskerId) {
        await tx.payout.create({
          data: {
            cleanerId: task.taskerId,
            taskId: task.id,
            stripeTransferId: `tr_task_${task.id}_${Date.now()}`,
            amountCents: quote.taskerPayoutCents,
            status: PayoutStatus.PAID,
            paidAt: new Date()
          }
        });
        await tx.cleanerProfile.update({
          where: { userId: task.taskerId },
          data: { tasksCompleted: { increment: 1 } }
        });
      }
    });

    await notify(task.customerId, "TASK_COMPLETED", "Task complete", `"${task.title}" is done. Rate your Tasker and leave a tip!`, `/dashboard/tasks/${task.id}`);
    return NextResponse.json({ success: true, totalCents: quote.totalCents });
  } catch (error) {
    console.error("Task status error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
