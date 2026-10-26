import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zip = searchParams.get("zip")?.trim();

    if (!zip) {
      return NextResponse.json(
        { error: "ZIP code query parameter is required." },
        { status: 400 }
      );
    }

    const zone = await prisma.serviceZone.findUnique({
      where: { zipCode: zip }
    });

    if (!zone || !zone.isActive) {
      return NextResponse.json({
        available: false,
        zipCode: zip,
        message: "We don't service this area yet, but you can join our waitlist!"
      });
    }

    return NextResponse.json({
      available: true,
      zipCode: zone.zipCode,
      city: zone.city,
      state: zone.state,
      basePriceCents: zone.basePriceCents
    });
  } catch (error) {
    console.error("Zone check error:", error);
    return NextResponse.json(
      { error: "Failed to check service zone availability." },
      { status: 500 }
    );
  }
}
