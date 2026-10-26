import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Role } from "@cleanaglow/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isCleaner = session.user.role === Role.CLEANER;

    const conversations = await prisma.conversation.findMany({
      where: isCleaner ? { cleanerId: userId } : { customerId: userId },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        cleaner: { select: { id: true, name: true, image: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const formatted = conversations.map((c) => {
      const otherUser = isCleaner ? c.customer : c.cleaner;
      const lastMessage = c.messages[0] || null;
      return {
        id: c.id,
        bookingId: c.bookingId,
        otherUser,
        lastMessage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, bookingId } = await req.json();

    const isCleaner = session.user.role === Role.CLEANER;
    const customerId = isCleaner ? targetUserId : session.user.id;
    const cleanerId = isCleaner ? session.user.id : targetUserId;

    const conversation = await prisma.conversation.upsert({
      where: {
        customerId_cleanerId: {
          customerId,
          cleanerId
        }
      },
      update: {
        ...(bookingId && { bookingId })
      },
      create: {
        customerId,
        cleanerId,
        bookingId
      },
      include: {
        customer: { select: { id: true, name: true } },
        cleaner: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
