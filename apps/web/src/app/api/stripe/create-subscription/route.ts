import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma, SubscriptionPlan, SubscriptionStatus, BookingStatus } from "@cleanaglow/db";
import { calculateEstimate, PlanTier, AddOnSelection } from "@cleanaglow/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      paymentMethodId,
      plan = "BIWEEKLY",
      bedrooms = 1,
      bathrooms = 1,
      sqft,
      addOns = {},
      zipCode,
      street,
      city,
      state,
      scheduledAt,
      notes
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { addresses: true, homeProfiles: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine zone & base price
    let basePriceCents = 12000;
    if (zipCode) {
      const zone = await prisma.serviceZone.findUnique({
        where: { zipCode: String(zipCode).trim() }
      });
      if (zone) basePriceCents = zone.basePriceCents;
    }

    const breakdown = calculateEstimate({
      basePriceCents,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      addOns: addOns as AddOnSelection,
      plan: plan as PlanTier
    });

    // 1. Create or retrieve Stripe customer
    let stripeCustomerId: string;
    const existingStripeCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingStripeCustomers.data.length > 0) {
      stripeCustomerId = existingStripeCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId && !paymentMethodId.startsWith("pm_mock")) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId
        });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId }
        });
      } catch (err) {
        console.warn("Could not attach real payment method in test mode:", err);
      }
    }

    // 2. Ensure Address and HomeProfile exist in DB
    let address = user.addresses[0];
    if (street && zipCode) {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          street,
          city: city || "New York",
          state: state || "NY",
          zip: zipCode,
          isDefault: true
        }
      });
    }

    let homeProfile = user.homeProfiles[0];
    if (!homeProfile) {
      homeProfile = await prisma.homeProfile.create({
        data: {
          customerId: user.id,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          sqft: sqft ? Number(sqft) : undefined
        }
      });
    }

    // 3. Create Subscription in DB & Stripe if recurring
    const planEnum = (plan === "ONE_TIME" ? "BIWEEKLY" : plan);
    const isRecurring = plan !== "ONE_TIME";

    let dbSubscription = null;
    let stripeSubId = `sub_mock_${Date.now()}`;

    if (isRecurring) {
      try {
        // Create custom recurring price or use pre-configured price
        const price = await stripe.prices.create({
          unit_amount: breakdown.recurringCleanTotalCents,
          currency: "usd",
          recurring: {
            interval: plan === "WEEKLY" ? "week" : "month",
            interval_count: plan === "BIWEEKLY" ? 2 : 1
          },
          product_data: {
            name: `CleanAglow ${plan} Cleaning Plan`
          }
        });

        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: price.id }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"]
        });
        stripeSubId = subscription.id;
      } catch (e) {
        console.warn("Stripe subscription creation fallback to mock:", e);
      }

      dbSubscription = await prisma.subscription.create({
        data: {
          customerId: user.id,
          stripeSubscriptionId: stripeSubId,
          stripePriceId: `price_${plan.toLowerCase()}`,
          plan: planEnum,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 4. Create initial Booking record
    const bookingTime = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 48 * 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        homeProfileId: homeProfile.id,
        addressId: address?.id,
        subscriptionId: dbSubscription?.id,
        scheduledAt: bookingTime,
        status: BookingStatus.PENDING,
        totalAmountCents: breakdown.firstCleanTotalCents,
        platformFeeCents: breakdown.platformFeeCents,
        cleanerPayoutCents: breakdown.cleanerPayoutCents,
        addOns: typeof addOns === "string" ? addOns : JSON.stringify(addOns),
        notes: notes || null
      }
    });

    // 5. Create Payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: `pi_${booking.id}_${Date.now()}`,
        amountCents: breakdown.firstCleanTotalCents,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      subscriptionId: dbSubscription?.id,
      breakdown,
      paymentId: payment.id
    });
  } catch (error: any) {
    console.error("Subscription & booking creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create subscription and booking." },
      { status: 500 }
    );
  }
}
