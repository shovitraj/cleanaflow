import { NextResponse } from "next/server";
import { prisma, TaskStatus, PayoutStatus } from "@cleanaglow/db";
import { getSessionUser, notify } from "@/lib/tasks";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amountCents } = await req.json();
    const tip = Math.round(Number(amountCents));
    if (!Number.isFinite(tip) || tip < 100 || tip > 50_000) {
      return NextResponse.json({ error: "Tip must be between $1 and $500." }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task || task.customerId !== user.id) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (task.status !== TaskStatus.COMPLETED || !task.taskerId) {
      return NextResponse.json({ error: "You can tip after the task is completed." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.task.update({ where: { id: task.id }, data: { tipCents: { increment: tip } } }),
      prisma.payout.create({
        data: {
          cleanerId: task.taskerId,
          taskId: task.id,
          stripeTransferId: `tr_tip_${task.id}_${Date.now()}`,
          amountCents: tip,
          status: PayoutStatus.PAID,
          paidAt: new Date()
        }
      })
    ]);

    await notify(task.taskerId, "PAYOUT_SENT", "You received a tip!", `${user.name || "Your customer"} tipped you $${(tip / 100).toFixed(2)}.`, "/pro/earnings");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tip error:", error);
    return NextResponse.json({ error: "Failed to send tip" }, { status: 500 });
  }
}
