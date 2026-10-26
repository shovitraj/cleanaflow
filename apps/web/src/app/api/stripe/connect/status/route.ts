import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma, Role } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.CLEANER) {
      return NextResponse.json({ error: "Cleaner account required." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { cleanerProfile: true }
    });

    if (!user || !user.cleanerProfile) {
      return NextResponse.json({ error: "Cleaner profile not found." }, { status: 404 });
    }

    const accountId = user.cleanerProfile.stripeConnectAccountId;
    let chargesEnabled = user.cleanerProfile.onboardingComplete;

    if (accountId && !accountId.startsWith("acct_mock")) {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        chargesEnabled = account.charges_enabled;

        if (chargesEnabled !== user.cleanerProfile.onboardingComplete) {
          await prisma.cleanerProfile.update({
            where: { id: user.cleanerProfile.id },
            data: { onboardingComplete: chargesEnabled }
          });
        }
      } catch (err) {
        console.warn("Could not retrieve Stripe Connect status:", err);
      }
    }

    return NextResponse.json({
      connected: !!accountId,
      accountId,
      onboardingComplete: chargesEnabled
    });
  } catch (error) {
    console.error("Connect status check error:", error);
    return NextResponse.json({ error: "Failed to check Connect status" }, { status: 500 });
  }
}
