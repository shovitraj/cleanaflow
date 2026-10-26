import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For MVP soft-decline, no mutation needed; returns success so client can hide job card
    return NextResponse.json({ success: true, bookingId: params.bookingId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to decline job" }, { status: 500 });
  }
}
