import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@cleanaglow/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, rating, body } = await req.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ error: "Booking ID and rating are required." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { cleaner: { include: { cleanerProfile: true } } }
    });

    if (!booking || booking.customerId !== session.user.id || !booking.cleanerId) {
      return NextResponse.json({ error: "Booking not found or not eligible for review." }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId: session.user.id,
        targetId: booking.cleanerId,
        rating: Number(rating),
        body: body || ""
      }
    });

    // Update cleaner's average rating & review count
    const cleanerReviews = await prisma.review.findMany({
      where: { targetId: booking.cleanerId }
    });

    const avg = cleanerReviews.reduce((sum, r) => sum + r.rating, 0) / cleanerReviews.length;

    await prisma.cleanerProfile.update({
      where: { userId: booking.cleanerId },
      data: {
        rating: Number(avg.toFixed(2)),
        reviewCount: cleanerReviews.length
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
