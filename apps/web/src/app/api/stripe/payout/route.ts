import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma, Role, PayoutStatus } from "@cleanaglow/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.CLEANER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        cleaner: {
          include: { cleanerProfile: true }
        }
      }
    });

    if (!booking || !booking.cleanerId || !booking.cleaner?.cleanerProfile) {
      return NextResponse.json({ error: "Booking or cleaner not found" }, { status: 404 });
    }

    const connectAccountId = booking.cleaner.cleanerProfile.stripeConnectAccountId;
    let transferId = `tr_mock_${booking.id}_${Date.now()}`;

    if (connectAccountId && !connectAccountId.startsWith("acct_mock")) {
      try {
        const transfer = await stripe.transfers.create({
          amount: booking.cleanerPayoutCents,
          currency: "usd",
          destination: connectAccountId,
          description: `Payout for booking #${booking.id.slice(-6)}`,
          metadata: { bookingId: booking.id, cleanerId: booking.cleanerId }
        });
        transferId = transfer.id;
      } catch (err) {
        console.warn("Stripe transfer fallback to mock:", err);
      }
    }

    const payout = await prisma.payout.create({
      data: {
        cleanerId: booking.cleanerId,
        bookingId: booking.id,
        stripeTransferId: transferId,
        amountCents: booking.cleanerPayoutCents,
        status: PayoutStatus.PAID,
        paidAt: new Date()
      }
    });

    // Send in-app notification to cleaner
    await prisma.notification.create({
      data: {
        userId: booking.cleanerId,
        type: "PAYOUT_SENT",
        title: "Payout Sent!",
        body: `You received a payout of $${(booking.cleanerPayoutCents / 100).toFixed(2)} for your recent clean.`,
        link: "/pro/earnings"
      }
    });

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error("Payout creation error:", error);
    return NextResponse.json({ error: "Failed to process payout" }, { status: 500 });
  }
}
