import { NextResponse } from "next/server";
import { prisma, TaskStatus } from "@cleanaglow/db";
import { isTaskCategory, clampTaskHours, calculateTaskPrice } from "@cleanaglow/types";
import { getSessionUser, notify, PUBLIC_TASKER_SELECT } from "@/lib/tasks";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      where: { customerId: user.id },
      include: {
        tasker: { select: PUBLIC_TASKER_SELECT },
        review: true,
        _count: { select: { offers: true } }
      },
      orderBy: { scheduledAt: "desc" }
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("List tasks error:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only customers can post tasks." }, { status: 403 });
    }

    const body = await req.json();
    const { category, title, description, street, city, state, zip, scheduledAt, flexibleTiming, estimatedHours, invitedTaskerId } = body;

    if (!isTaskCategory(category)) {
      return NextResponse.json({ error: "Invalid task category." }, { status: 400 });
    }
    if (!title?.trim() || !description?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !zip?.trim()) {
      return NextResponse.json({ error: "Title, description and full address are required." }, { status: 400 });
    }
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) {
      return NextResponse.json({ error: "Choose a date and time in the future." }, { status: 400 });
    }

    let invitedId: string | null = null;
    let invitedRateCents: number | null = null;
    if (invitedTaskerId) {
      const tasker = await prisma.user.findUnique({
        where: { id: String(invitedTaskerId) },
        include: { cleanerProfile: true }
      });
      if (!tasker?.cleanerProfile || !tasker.cleanerProfile.isActive || tasker.role !== "CLEANER") {
        return NextResponse.json({ error: "That Tasker is not available." }, { status: 400 });
      }
      invitedId = tasker.id;
      invitedRateCents = tasker.cleanerProfile.hourlyRateCents;
    }

    const task = await prisma.task.create({
      data: {
        customerId: user.id,
        invitedTaskerId: invitedId,
        category,
        title: title.trim(),
        description: description.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        scheduledAt: when,
        flexibleTiming: !!flexibleTiming,
        estimatedHours: clampTaskHours(Number(estimatedHours) || 1)
      }
    });

    if (invitedId && invitedRateCents) {
      const quote = calculateTaskPrice(invitedRateCents, task.estimatedHours);
      await notify(
        invitedId,
        "NEW_TASK_OFFER",
        "You've been requested!",
        `${user.name || "A customer"} wants to hire you for "${task.title}" (est. $${(quote.subtotalCents / 100).toFixed(2)}).`,
        "/pro/tasks"
      );
    }

    return NextResponse.json({ success: true, task, status: TaskStatus.OPEN }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
