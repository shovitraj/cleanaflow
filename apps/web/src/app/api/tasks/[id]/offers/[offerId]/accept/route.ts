import { NextResponse } from "next/server";
import { prisma, TaskOfferStatus } from "@cleanaglow/db";
import { getSessionUser, notify, assignTask, taskAssignErrorResponse } from "@/lib/tasks";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; offerId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const offer = await prisma.taskOffer.findUnique({
      where: { id: params.offerId },
      include: { task: true }
    });
    if (!offer || offer.taskId !== params.id) {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }
    if (offer.task.customerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (offer.status !== TaskOfferStatus.PENDING) {
      return NextResponse.json({ error: "Offer is no longer available." }, { status: 409 });
    }

    const updated = await assignTask(offer.taskId, offer.taskerId, offer.hourlyRateCents, offer.id);

    await notify(
      offer.taskerId,
      "TASK_OFFER_ACCEPTED",
      "You got the job!",
      `${user.name || "The customer"} accepted your offer for "${offer.task.title}".`,
      "/pro/tasks"
    );

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    const handled = taskAssignErrorResponse(error);
    if (handled) return handled;
    console.error("Accept offer error:", error);
    return NextResponse.json({ error: "Failed to accept offer" }, { status: 500 });
  }
}
