import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";
import { calculateEstimate, PlanTier, AddOnSelection } from "@cleanaglow/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zipCode, bedrooms = 1, bathrooms = 1, sqft, addOns = {}, plan = "BIWEEKLY" } = body;

    let basePriceCents = 12000; // default fallback $120

    if (zipCode) {
      const zone = await prisma.serviceZone.findUnique({
        where: { zipCode: String(zipCode).trim() }
      });
      if (zone) {
        basePriceCents = zone.basePriceCents;
      }
    }

    // Read platform commission rate from platform config if available
    let commissionRate = 0.30;
    const config = await prisma.platformConfig.findUnique({
      where: { key: "PLATFORM_COMMISSION_RATE" }
    });
    if (config?.value) {
      const parsed = parseFloat(config.value);
      if (!isNaN(parsed)) commissionRate = parsed;
    }

    const breakdown = calculateEstimate(
      {
        basePriceCents,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: sqft ? Number(sqft) : undefined,
        addOns: addOns as AddOnSelection,
        plan: plan as PlanTier
      },
      commissionRate
    );

    return NextResponse.json({
      success: true,
      breakdown
    });
  } catch (error) {
    console.error("Pricing calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing estimate." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zipCode = searchParams.get("zip") || "10001";
    const bedrooms = parseInt(searchParams.get("bedrooms") || "1", 10);
    const bathrooms = parseInt(searchParams.get("bathrooms") || "1", 10);
    const plan = (searchParams.get("plan") || "BIWEEKLY") as PlanTier;
    const fridge = searchParams.get("fridge") === "true";
    const oven = searchParams.get("oven") === "true";
    const windows = searchParams.get("windows") === "true";
    const laundry = searchParams.get("laundry") === "true";

    let basePriceCents = 12000;
    const zone = await prisma.serviceZone.findUnique({
      where: { zipCode }
    });
    if (zone) basePriceCents = zone.basePriceCents;

    const breakdown = calculateEstimate({
      basePriceCents,
      bedrooms,
      bathrooms,
      plan,
      addOns: { fridge, oven, windows, laundry }
    });

    return NextResponse.json({ success: true, breakdown });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate pricing estimate." },
      { status: 500 }
    );
  }
}
