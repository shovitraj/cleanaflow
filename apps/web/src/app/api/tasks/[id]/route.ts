import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";
import { getSessionUser, PUBLIC_TASKER_SELECT } from "@/lib/tasks";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        tasker: { select: PUBLIC_TASKER_SELECT },
        offers: {
          include: { tasker: { select: PUBLIC_TASKER_SELECT } },
          orderBy: { createdAt: "asc" }
        },
        review: true
      }
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const isOwner = task.customerId === user.id;
    const isAssigned = task.taskerId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isInvited = task.invitedTaskerId === user.id;
    const isOpenToPros = user.role === "CLEANER" && task.status === "OPEN" && !task.invitedTaskerId;

    if (!isOwner && !isAssigned && !isAdmin && !isInvited && !isOpenToPros) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Non-owners only see their own offer.
    const offers = isOwner || isAdmin ? task.offers : task.offers.filter((o) => o.taskerId === user.id);
    // Exact address only after assignment.
    const showAddress = isOwner || isAdmin || isAssigned;
    return NextResponse.json({
      task: {
        ...task,
        offers,
        street: showAddress ? task.street : "Address shared after booking"
      },
      viewer: { isOwner, isAssigned }
    });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json({ error: "Failed to load task" }, { status: 500 });
  }
}
