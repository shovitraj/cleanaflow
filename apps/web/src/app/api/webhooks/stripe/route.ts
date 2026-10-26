import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma, SubscriptionStatus, BookingStatus, PaymentStatus } from "@cleanaglow/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = invoice.subscription as string;

        if (stripeSubscriptionId) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
            include: { customer: { include: { homeProfiles: true, addresses: true } } }
          });

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: new Date((invoice.period_end || Date.now() / 1000 + 14 * 86400) * 1000)
              }
            });

            // Schedule the next recurring booking
            const intervalDays = subscription.plan === "WEEKLY" ? 7 : subscription.plan === "BIWEEKLY" ? 14 : 30;
            const scheduledAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

            const lastBooking = await prisma.booking.findFirst({
              where: { subscriptionId: subscription.id },
              orderBy: { createdAt: "desc" }
            });

            if (lastBooking) {
              const newBooking = await prisma.booking.create({
                data: {
                  customerId: subscription.customerId,
                  cleanerId: lastBooking.cleanerId, // retain preferred cleaner if assigned
                  homeProfileId: lastBooking.homeProfileId,
                  addressId: lastBooking.addressId,
                  subscriptionId: subscription.id,
                  scheduledAt,
                  status: BookingStatus.PENDING,
                  totalAmountCents: lastBooking.totalAmountCents,
                  platformFeeCents: lastBooking.platformFeeCents,
                  cleanerPayoutCents: lastBooking.cleanerPayoutCents,
                  addOns: lastBooking.addOns
                }
              });

              await prisma.payment.create({
                data: {
                  bookingId: newBooking.id,
                  stripePaymentIntentId: (invoice.payment_intent as string) || `pi_${newBooking.id}`,
                  amountCents: invoice.amount_paid || newBooking.totalAmountCents,
                  status: PaymentStatus.SUCCEEDED
                }
              });
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = invoice.subscription as string;

        if (stripeSubscriptionId) {
          const sub = await prisma.subscription.updateMany({
            where: { stripeSubscriptionId },
            data: { status: SubscriptionStatus.PAUSED }
          });

          const dbSub = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId }
          });

          if (dbSub) {
            await prisma.notification.create({
              data: {
                userId: dbSub.customerId,
                type: "PAYMENT_FAILED",
                title: "Subscription Payment Failed",
                body: "Your latest subscription payment failed. Please update your payment method to keep your cleans active.",
                link: "/dashboard/settings"
              }
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: SubscriptionStatus.CANCELED,
            cancelAtPeriodEnd: true
          }
        });
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: PaymentStatus.SUCCEEDED }
        });
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
