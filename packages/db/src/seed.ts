import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus, BookingStatus } from "./index";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.homeProfile.deleteMany();
  await prisma.cleanerProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceZone.deleteMany();
  await prisma.addOnPricing.deleteMany();
  await prisma.platformConfig.deleteMany();

  // 1. Platform Config
  await prisma.platformConfig.createMany({
    data: [
      { key: "PLATFORM_COMMISSION_RATE", value: "0.30", description: "Default platform fee (30%)" },
      { key: "CANCELLATION_FEE_PERCENT", value: "0.50", description: "Cancellation fee within 24h (50%)" },
      { key: "MIN_PAYOUT_THRESHOLD", value: "2500", description: "Minimum payout cents ($25.00)" }
    ]
  });

  // 2. Service Zones
  const zones = await Promise.all([
    prisma.serviceZone.create({ data: { zipCode: "10001", city: "New York", state: "NY", basePriceCents: 12000, isActive: true } }),
    prisma.serviceZone.create({ data: { zipCode: "10002", city: "New York", state: "NY", basePriceCents: 12000, isActive: true } }),
    prisma.serviceZone.create({ data: { zipCode: "10003", city: "New York", state: "NY", basePriceCents: 12500, isActive: true } }),
    prisma.serviceZone.create({ data: { zipCode: "94102", city: "San Francisco", state: "CA", basePriceCents: 14000, isActive: true } }),
    prisma.serviceZone.create({ data: { zipCode: "94103", city: "San Francisco", state: "CA", basePriceCents: 14000, isActive: true } }),
    prisma.serviceZone.create({ data: { zipCode: "90210", city: "Beverly Hills", state: "CA", basePriceCents: 16000, isActive: true } })
  ]);

  // 3. Add-On Pricing
  await prisma.addOnPricing.createMany({
    data: [
      { name: "fridge", priceCents: 3500, durationMinutes: 30 },
      { name: "oven", priceCents: 3500, durationMinutes: 30 },
      { name: "windows", priceCents: 4000, durationMinutes: 45 },
      { name: "laundry", priceCents: 3000, durationMinutes: 40 }
    ]
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 4. Admin User
  const admin = await prisma.user.create({
    data: {
      email: "admin@cleanaglow.com",
      name: "Super Admin",
      role: Role.ADMIN,
      passwordHash,
      emailVerified: new Date()
    }
  });

  // 5. Cleaners (5 pros)
  const cleanerData = [
    { name: "Maria Santos", email: "maria@cleanaglow.com", bio: "10+ years residential cleaning experience. Detail-oriented and pet-friendly.", zips: ["10001", "10002", "10003"], rating: 4.95, reviews: 48 },
    { name: "Elena Rostova", email: "elena@cleanaglow.com", bio: "Eco-friendly products specialist. Deep clean expert.", zips: ["10001", "10003"], rating: 4.88, reviews: 32 },
    { name: "David Kim", email: "david@cleanaglow.com", bio: "Fast, reliable, and thorough home cleaner.", zips: ["94102", "94103"], rating: 4.92, reviews: 29 },
    { name: "Aisha Johnson", email: "aisha@cleanaglow.com", bio: "Passionate about sparkling homes and happy customers.", zips: ["10002", "10003"], rating: 5.0, reviews: 15 },
    { name: "Carlos Mendez", email: "carlos@cleanaglow.com", bio: "Professional move-in/move-out and recurring cleaning pro.", zips: ["90210"], rating: 4.79, reviews: 22 }
  ];

  const cleaners = [];
  for (const c of cleanerData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        role: Role.CLEANER,
        passwordHash,
        emailVerified: new Date(),
        cleanerProfile: {
          create: {
            bio: c.bio,
            rating: c.rating,
            reviewCount: c.reviews,
            serviceZipCodes: c.zips.join(", "),
            onboardingComplete: true,
            stripeConnectAccountId: `acct_mock_${c.name.toLowerCase().replace(" ", "_")}`
          }
        }
      }
    });
    cleaners.push(user);
  }

  // 6. Customers (3 customers)
  const customerData = [
    { name: "Sarah Jenkins", email: "sarah@example.com", zip: "10001", street: "123 5th Ave, Apt 4B", beds: 2, baths: 2, sqft: 1100 },
    { name: "Michael Chang", email: "michael@example.com", zip: "94102", street: "456 Market St, Unit 12", beds: 1, baths: 1, sqft: 750 },
    { name: "Emily Watson", email: "emily@example.com", zip: "10003", street: "789 Broadway, Floor 3", beds: 3, baths: 2, sqft: 1800 }
  ];

  const customers = [];
  for (const cust of customerData) {
    const user = await prisma.user.create({
      data: {
        email: cust.email,
        name: cust.name,
        role: Role.CUSTOMER,
        passwordHash,
        emailVerified: new Date(),
        addresses: {
          create: {
            street: cust.street,
            city: cust.zip === "94102" ? "San Francisco" : "New York",
            state: cust.zip === "94102" ? "CA" : "NY",
            zip: cust.zip,
            isDefault: true
          }
        },
        homeProfiles: {
          create: {
            bedrooms: cust.beds,
            bathrooms: cust.baths,
            sqft: cust.sqft,
            entryInstructions: "Buzz 4B or lockbox code 1234",
            parkingInstructions: "Street parking available on side streets"
          }
        }
      },
      include: {
        addresses: true,
        homeProfiles: true
      }
    });
    customers.push(user);
  }

  // 7. Subscriptions for 2 customers
  const sub1 = await prisma.subscription.create({
    data: {
      customerId: customers[0].id,
      stripeSubscriptionId: "sub_mock_sarah_weekly",
      stripePriceId: "price_weekly_test",
      plan: SubscriptionPlan.BIWEEKLY,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  const sub2 = await prisma.subscription.create({
    data: {
      customerId: customers[1].id,
      stripeSubscriptionId: "sub_mock_michael_monthly",
      stripePriceId: "price_monthly_test",
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // 8. Bookings (10 bookings across various states)
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const bookingsToCreate = [
    // Completed past bookings
    {
      customerId: customers[0].id,
      cleanerId: cleaners[0].id,
      homeProfileId: customers[0].homeProfiles[0].id,
      addressId: customers[0].addresses[0].id,
      subscriptionId: sub1.id,
      scheduledAt: new Date(now - 14 * DAY),
      status: BookingStatus.COMPLETED,
      totalAmountCents: 17000,
      platformFeeCents: 5100,
      cleanerPayoutCents: 11900,
      addOns: JSON.stringify({ fridge: true })
    },
    {
      customerId: customers[0].id,
      cleanerId: cleaners[0].id,
      homeProfileId: customers[0].homeProfiles[0].id,
      addressId: customers[0].addresses[0].id,
      subscriptionId: sub1.id,
      scheduledAt: new Date(now - 7 * DAY),
      status: BookingStatus.COMPLETED,
      totalAmountCents: 13500,
      platformFeeCents: 4050,
      cleanerPayoutCents: 9450,
      addOns: JSON.stringify({})
    },
    {
      customerId: customers[1].id,
      cleanerId: cleaners[2].id,
      homeProfileId: customers[1].homeProfiles[0].id,
      addressId: customers[1].addresses[0].id,
      subscriptionId: sub2.id,
      scheduledAt: new Date(now - 10 * DAY),
      status: BookingStatus.COMPLETED,
      totalAmountCents: 14000,
      platformFeeCents: 4200,
      cleanerPayoutCents: 9800,
      addOns: JSON.stringify({ oven: true })
    },
    // Upcoming confirmed bookings
    {
      customerId: customers[0].id,
      cleanerId: cleaners[0].id,
      homeProfileId: customers[0].homeProfiles[0].id,
      addressId: customers[0].addresses[0].id,
      subscriptionId: sub1.id,
      scheduledAt: new Date(now + 2 * DAY),
      status: BookingStatus.CONFIRMED,
      totalAmountCents: 13500,
      platformFeeCents: 4050,
      cleanerPayoutCents: 9450,
      addOns: JSON.stringify({})
    },
    {
      customerId: customers[1].id,
      cleanerId: cleaners[2].id,
      homeProfileId: customers[1].homeProfiles[0].id,
      addressId: customers[1].addresses[0].id,
      subscriptionId: sub2.id,
      scheduledAt: new Date(now + 5 * DAY),
      status: BookingStatus.CONFIRMED,
      totalAmountCents: 14000,
      platformFeeCents: 4200,
      cleanerPayoutCents: 9800,
      addOns: JSON.stringify({})
    },
    {
      customerId: customers[2].id,
      cleanerId: cleaners[1].id,
      homeProfileId: customers[2].homeProfiles[0].id,
      addressId: customers[2].addresses[0].id,
      scheduledAt: new Date(now + 3 * DAY),
      status: BookingStatus.CONFIRMED,
      totalAmountCents: 21500,
      platformFeeCents: 6450,
      cleanerPayoutCents: 15050,
      addOns: JSON.stringify({ windows: true, laundry: true })
    },
    // Pending jobs on board (unassigned)
    {
      customerId: customers[2].id,
      cleanerId: null,
      homeProfileId: customers[2].homeProfiles[0].id,
      addressId: customers[2].addresses[0].id,
      scheduledAt: new Date(now + 1 * DAY),
      status: BookingStatus.PENDING,
      totalAmountCents: 18500,
      platformFeeCents: 5550,
      cleanerPayoutCents: 12950,
      addOns: JSON.stringify({ fridge: true })
    },
    {
      customerId: customers[0].id,
      cleanerId: null,
      homeProfileId: customers[0].homeProfiles[0].id,
      addressId: customers[0].addresses[0].id,
      scheduledAt: new Date(now + 4 * DAY),
      status: BookingStatus.PENDING,
      totalAmountCents: 13500,
      platformFeeCents: 4050,
      cleanerPayoutCents: 9450,
      addOns: JSON.stringify({})
    },
    // In progress job
    {
      customerId: customers[0].id,
      cleanerId: cleaners[0].id,
      homeProfileId: customers[0].homeProfiles[0].id,
      addressId: customers[0].addresses[0].id,
      scheduledAt: new Date(now),
      status: BookingStatus.IN_PROGRESS,
      totalAmountCents: 13500,
      platformFeeCents: 4050,
      cleanerPayoutCents: 9450,
      addOns: JSON.stringify({})
    },
    // Disputed past booking
    {
      customerId: customers[2].id,
      cleanerId: cleaners[3].id,
      homeProfileId: customers[2].homeProfiles[0].id,
      addressId: customers[2].addresses[0].id,
      scheduledAt: new Date(now - 3 * DAY),
      status: BookingStatus.DISPUTED,
      totalAmountCents: 19500,
      platformFeeCents: 5850,
      cleanerPayoutCents: 13650,
      addOns: JSON.stringify({ oven: true })
    }
  ];

  for (let i = 0; i < bookingsToCreate.length; i++) {
    const b = bookingsToCreate[i];
    const booking = await prisma.booking.create({ data: b });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: `pi_mock_${booking.id}`,
        amountCents: booking.totalAmountCents,
        status: booking.status === BookingStatus.COMPLETED ? "SUCCEEDED" : "PENDING"
      }
    });

    // For completed bookings, create payout and review
    if (booking.status === BookingStatus.COMPLETED && booking.cleanerId) {
      await prisma.payout.create({
        data: {
          bookingId: booking.id,
          cleanerId: booking.cleanerId,
          stripeTransferId: `tr_mock_${booking.id}`,
          amountCents: booking.cleanerPayoutCents,
          status: "PAID",
          paidAt: new Date()
        }
      });

      await prisma.review.create({
        data: {
          bookingId: booking.id,
          authorId: booking.customerId,
          targetId: booking.cleanerId,
          rating: 5,
          body: "Fantastic clean! Everything sparkled and smelled fresh."
        }
      });
    }

    // For disputed booking, create Dispute
    if (booking.status === BookingStatus.DISPUTED) {
      await prisma.dispute.create({
        data: {
          bookingId: booking.id,
          reporterId: booking.customerId,
          reason: "Missed deep clean add-on areas",
          description: "Oven inside was not cleaned although the add-on was selected and paid for.",
          status: "OPEN"
        }
      });
    }
  }

  // 9. Create a conversation and messages between customer 0 and cleaner 0
  const conv = await prisma.conversation.create({
    data: {
      customerId: customers[0].id,
      cleanerId: cleaners[0].id
    }
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv.id, senderId: customers[0].id, body: "Hi Maria! Just checking if 10am still works for tomorrow?", createdAt: new Date(now - 3600000) },
      { conversationId: conv.id, senderId: cleaners[0].id, body: "Hi Sarah! Yes, 10am is perfect. See you tomorrow!", createdAt: new Date(now - 1800000) }
    ]
  });

  console.log("Database seeded successfully!");
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Cleaners: ${cleaners.length}`);
  console.log(`- Customers: ${customers.length}`);
  console.log(`- Bookings: ${bookingsToCreate.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
