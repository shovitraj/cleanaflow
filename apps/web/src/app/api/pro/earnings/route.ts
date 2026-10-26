import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, PayoutStatus } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleaner = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        cleanerProfile: true,
        payouts: {
          orderBy: { createdAt: "desc" },
          include: { booking: { include: { address: true } } }
        }
      }
    });

    if (!cleaner) {
      return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
    }

    const paidPayouts = cleaner.payouts.filter((p) => p.status === PayoutStatus.PAID);
    const totalEarningsCents = paidPayouts.reduce((sum, p) => sum + p.amountCents, 0);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekEarningsCents = paidPayouts
      .filter((p) => p.paidAt && new Date(p.paidAt) >= oneWeekAgo)
      .reduce((sum, p) => sum + p.amountCents, 0);

    const thisMonthEarningsCents = paidPayouts
      .filter((p) => p.paidAt && new Date(p.paidAt) >= thisMonthStart)
      .reduce((sum, p) => sum + p.amountCents, 0);

    return NextResponse.json({
      summary: {
        totalEarningsCents,
        thisWeekEarningsCents,
        thisMonthEarningsCents,
        completedJobsCount: paidPayouts.length
      },
      payouts: cleaner.payouts,
      profile: cleaner.cleanerProfile
    });
  } catch (error) {
    console.error("Earnings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}
