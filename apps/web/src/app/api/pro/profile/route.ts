import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@cleanaglow/db";
import { isTaskCategory } from "@cleanaglow/types";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, serviceZipCodes, avatarUrl, isActive, headline, skills, hourlyRateCents, hasVehicle, yearsExperience } = body;

    const rate = hourlyRateCents !== undefined ? Math.round(Number(hourlyRateCents)) : undefined;
    if (rate !== undefined && (!Number.isFinite(rate) || rate < 1500 || rate > 50000)) {
      return NextResponse.json({ error: "Hourly rate must be between $15 and $500." }, { status: 400 });
    }
    const skillList = Array.isArray(skills) ? skills.filter(isTaskCategory) : undefined;
    if (skillList && skillList.length === 0) {
      return NextResponse.json({ error: "Select at least one skill." }, { status: 400 });
    }

    const updated = await prisma.cleanerProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(serviceZipCodes !== undefined && { serviceZipCodes }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(headline !== undefined && { headline }),
        ...(skillList && { skills: skillList.join(", ") }),
        ...(rate !== undefined && { hourlyRateCents: rate }),
        ...(hasVehicle !== undefined && { hasVehicle: !!hasVehicle }),
        ...(yearsExperience !== undefined && { yearsExperience: Math.max(0, Math.round(Number(yearsExperience)) || 0) })
      }
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await prisma.cleanerProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
