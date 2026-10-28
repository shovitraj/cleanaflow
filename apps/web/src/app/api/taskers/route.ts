import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";
import { isTaskCategory } from "@cleanaglow/types";
import { parseList, PUBLIC_TASKER_SELECT } from "@/lib/tasks";

// Public browse: GET /api/taskers?category=&zip=&sort=rating|price|tasks&vehicle=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const zip = searchParams.get("zip")?.trim();
    const sort = searchParams.get("sort") || "rating";
    const vehicle = searchParams.get("vehicle") === "1";

    const users = await prisma.user.findMany({
      where: { role: "CLEANER", cleanerProfile: { isActive: true, ...(vehicle && { hasVehicle: true }) } },
      select: PUBLIC_TASKER_SELECT
    });

    let taskers = users.filter((u) => {
      const p = u.cleanerProfile!;
      if (category && isTaskCategory(category) && !parseList(p.skills).includes(category)) return false;
      if (zip && !parseList(p.serviceZipCodes).includes(zip)) return false;
      return true;
    });

    taskers.sort((a, b) => {
      const pa = a.cleanerProfile!, pb = b.cleanerProfile!;
      if (sort === "price") return pa.hourlyRateCents - pb.hourlyRateCents;
      if (sort === "tasks") return pb.tasksCompleted - pa.tasksCompleted;
      return pb.rating - pa.rating || pb.reviewCount - pa.reviewCount;
    });

    return NextResponse.json({ taskers });
  } catch (error) {
    console.error("Browse taskers error:", error);
    return NextResponse.json({ error: "Failed to load Taskers" }, { status: 500 });
  }
}
