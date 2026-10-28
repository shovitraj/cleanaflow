import { NextResponse } from "next/server";
import { prisma, TaskStatus } from "@cleanaglow/db";
import { getSessionUser, notify, assignTask, taskAssignErrorResponse } from "@/lib/tasks";

// Respond to a direct "Choose your Tasker" request. body: { action: "accept" | "decline" }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action } = await req.json();
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task || task.invitedTaskerId !== user.id || task.status !== TaskStatus.OPEN) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    if (action === "decline") {
      // Release to the open marketplace so other Taskers can bid.
      await prisma.task.update({ where: { id: task.id }, data: { invitedTaskerId: null } });
      await notify(task.customerId, "TASK_STATUS_UPDATED", "Tasker unavailable", `Your requested Tasker can't do "${task.title}". We opened it to other Taskers.`, `/dashboard/tasks/${task.id}`);
      return NextResponse.json({ success: true });
    }
    if (action !== "accept") return NextResponse.json({ error: "Invalid action." }, { status: 400 });

    const profile = await prisma.cleanerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "Tasker profile not found" }, { status: 404 });

    const updated = await assignTask(task.id, user.id, profile.hourlyRateCents);
    await notify(task.customerId, "TASK_OFFER_ACCEPTED", "Tasker confirmed!", `${user.name || "Your Tasker"} accepted "${task.title}".`, `/dashboard/tasks/${task.id}`);
    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    const handled = taskAssignErrorResponse(error);
    if (handled) return handled;
    console.error("Invite response error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
