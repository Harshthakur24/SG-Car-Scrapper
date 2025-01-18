import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (email !== adminEmail) {
      return NextResponse.json(
        { success: false, error: "Invalid admin email" },
        { status: 403 }
      );
    }

    // Find the latest unused OTP for this email
    const otpRecord = await prisma.adminOTP.findFirst({
      where: {
        email,
        otp,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.adminOTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Generate JWT token
    const token = sign(
      { email, role: "admin" },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Verification failed",
      },
      { status: 500 }
    );
  }
}
