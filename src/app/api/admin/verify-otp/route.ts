/* eslint-disable @typescript-eslint/no-explicit-any */
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

    await prisma.adminOTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const token = sign(
      { email, role: "admin" },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    const response = NextResponse.json({
      success: true,
      token,
    });

    return response;
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