import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma, TaskStatus, TaskOfferStatus } from "@cleanaglow/db";
import { calculateTaskPrice } from "@cleanaglow/types";
import type { NotificationType } from "@cleanaglow/types";

export function parseList(value: string | null | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? null, role: session.user.role as string };
}

/** Fields of a tasker that are safe to show to customers. */
export const PUBLIC_TASKER_SELECT = {
  id: true,
  name: true,
  image: true,
  cleanerProfile: {
    select: {
      bio: true,
      headline: true,
      skills: true,
      hourlyRateCents: true,
      hasVehicle: true,
      yearsExperience: true,
      tasksCompleted: true,
      isElite: true,
      rating: true,
      reviewCount: true,
      serviceZipCodes: true,
      isActive: true
    }
  }
} as const;

/** Assign `taskerId` to the task at the given rate inside a transaction. Throws on race. */
export async function assignTask(taskId: string, taskerId: string, hourlyRateCents: number, offerId?: string) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (task.status !== TaskStatus.OPEN || task.taskerId) throw new Error("TASK_NOT_OPEN");

    const quote = calculateTaskPrice(hourlyRateCents, task.estimatedHours);
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        taskerId,
        status: TaskStatus.ASSIGNED,
        hourlyRateCents,
        subtotalCents: quote.subtotalCents,
        trustFeeCents: quote.trustFeeCents,
        taskerPayoutCents: quote.taskerPayoutCents
      }
    });

    await tx.taskOffer.updateMany({
      where: { taskId, status: TaskOfferStatus.PENDING },
      data: { status: TaskOfferStatus.DECLINED }
    });
    if (offerId) {
      await tx.taskOffer.update({ where: { id: offerId }, data: { status: TaskOfferStatus.ACCEPTED } });
    }

    await tx.payment.create({
      data: {
        taskId,
        stripePaymentIntentId: `pi_task_${taskId}_${Date.now()}`,
        amountCents: quote.totalCents,
        status: "PENDING"
      }
    });

    await tx.conversation.upsert({
      where: { customerId_cleanerId: { customerId: task.customerId, cleanerId: taskerId } },
      update: {},
      create: { customerId: task.customerId, cleanerId: taskerId }
    });

    return updated;
  });
}

export function taskAssignErrorResponse(error: any) {
  if (error?.message === "TASK_NOT_OPEN") {
    return NextResponse.json({ error: "This task has already been assigned or closed." }, { status: 409 });
  }
  if (error?.message === "TASK_NOT_FOUND") {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return null;
}
