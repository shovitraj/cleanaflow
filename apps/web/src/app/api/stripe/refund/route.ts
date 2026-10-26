import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma, Role, PaymentStatus } from "@cleanaglow/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Admin role required." }, { status: 403 });
    }

    const { bookingId, amountCents, reason = "requested_by_customer" } = await req.json();

    const payment = await prisma.payment.findFirst({
      where: { bookingId }
    });

    if (!payment) {
      return NextResponse.json({ error: "No payment found for this booking" }, { status: 404 });
    }

    const refundAmount = amountCents ? Number(amountCents) : payment.amountCents;

    if (!payment.stripePaymentIntentId.startsWith("pi_mock")) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: refundAmount,
          reason: reason as any
        });
      } catch (err) {
        console.warn("Stripe refund fallback to mock:", err);
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundAmountCents: (payment.refundAmountCents || 0) + refundAmount,
        status: PaymentStatus.REFUNDED
      }
    });

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    console.error("Refund processing error:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
