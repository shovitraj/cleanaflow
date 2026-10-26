export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Role } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const zones = await prisma.serviceZone.findMany({
      orderBy: { zipCode: "asc" }
    });

    return NextResponse.json({ zones });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load service zones" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { zipCode, city, state, basePriceCents, isActive } = await req.json();

    const zone = await prisma.serviceZone.upsert({
      where: { zipCode: zipCode.trim() },
      update: {
        city,
        state,
        basePriceCents: Number(basePriceCents),
        isActive: Boolean(isActive)
      },
      create: {
        zipCode: zipCode.trim(),
        city,
        state,
        basePriceCents: Number(basePriceCents),
        isActive: Boolean(isActive)
      }
    });

    return NextResponse.json({ success: true, zone });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save service zone" }, { status: 500 });
  }
}
