import { NextResponse } from "next/server";
import { prisma, Role } from "@cleanaglow/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role = "CUSTOMER", serviceZipCodes = [] } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = role === "CLEANER" ? Role.CLEANER : Role.CUSTOMER;
    const zipString = Array.isArray(serviceZipCodes) ? serviceZipCodes.join(", ") : String(serviceZipCodes);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name,
        role: assignedRole,
        ...(assignedRole === Role.CLEANER
          ? {
              cleanerProfile: {
                create: {
                  serviceZipCodes: zipString || "10001, 10002",
                  onboardingComplete: false
                }
              }
            }
          : {
              homeProfiles: {
                create: {
                  bedrooms: 2,
                  bathrooms: 1
                }
              }
            })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      { message: "Account created successfully.", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating your account." },
      { status: 500 }
    );
  }
}
