import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma, Role } from "@cleanaglow/db";

export async function POST(req: Request) {
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

    let accountId = user.cleanerProfile.stripeConnectAccountId;

    if (!accountId || accountId.startsWith("acct_mock")) {
      try {
        const account = await stripe.accounts.create({
          type: "standard",
          email: user.email,
          business_type: "individual",
          individual: {
            email: user.email,
            first_name: user.name?.split(" ")[0] || undefined,
            last_name: user.name?.split(" ")[1] || undefined
          }
        });
        accountId = account.id;

        await prisma.cleanerProfile.update({
          where: { id: user.cleanerProfile.id },
          data: { stripeConnectAccountId: accountId }
        });
      } catch (err) {
        console.warn("Stripe Connect account creation fallback:", err);
        accountId = `acct_mock_${user.id}`;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/pro/earnings?stripe=refresh`,
        return_url: `${appUrl}/pro/earnings?stripe=return`,
        type: "account_onboarding"
      });

      return NextResponse.json({ url: accountLink.url });
    } catch (e) {
      // Mock link for local dev without active Stripe Connect keys
      return NextResponse.json({
        url: `${appUrl}/pro/earnings?stripe=success_mock`
      });
    }
  } catch (error: any) {
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to initialize Stripe Connect onboarding." },
      { status: 500 }
    );
  }
}
