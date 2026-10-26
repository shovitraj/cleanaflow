import { NextResponse } from "next/server";
import { prisma } from "@cleanaglow/db";

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required." },
        { status: 400 }
      );
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        token
      }
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({
      where: { token }
    });

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification." },
      { status: 500 }
    );
  }
}
