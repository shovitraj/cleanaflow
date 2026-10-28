import { NextResponse } from "next/server";
import { prisma, TaskStatus } from "@cleanaglow/db";
import { getSessionUser, parseList } from "@/lib/tasks";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.cleanerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "Tasker profile not found" }, { status: 404 });

    const skills = parseList(profile.skills);
    const zips = parseList(profile.serviceZipCodes);
    const include = { customer: { select: { id: true, name: true, image: true } } };

    const [openTasks, invitations, myOffers, myTasks] = await Promise.all([
      prisma.task.findMany({
        where: {
          status: TaskStatus.OPEN,
          invitedTaskerId: null,
          scheduledAt: { gte: new Date() },
          category: { in: skills },
          zip: { in: zips },
          offers: { none: { taskerId: user.id } }
        },
        include,
        orderBy: { scheduledAt: "asc" }
      }),
      prisma.task.findMany({
        where: { status: TaskStatus.OPEN, invitedTaskerId: user.id },
        include,
        orderBy: { scheduledAt: "asc" }
      }),
      prisma.taskOffer.findMany({
        where: { taskerId: user.id, status: "PENDING", task: { status: TaskStatus.OPEN } },
        include: { task: { include } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.task.findMany({
        where: { taskerId: user.id, status: { in: [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS] } },
        include,
        orderBy: { scheduledAt: "asc" }
      })
    ]);

    // Hide street until assigned; zip/city is enough to decide.
    const mask = <T extends { street: string }>(t: T): T => ({ ...t, street: "Address shared after booking" });
    return NextResponse.json({
      profile: { hourlyRateCents: profile.hourlyRateCents, skills, serviceZipCodes: zips },
      openTasks: openTasks.map(mask),
      invitations: invitations.map(mask),
      myOffers: myOffers.map((o) => ({ ...o, task: mask(o.task) })),
      myTasks
    });
  } catch (error) {
    console.error("Pro tasks error:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
