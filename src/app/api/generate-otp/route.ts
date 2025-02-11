import { NextResponse } from "next/server";
import { generateOTP, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, phoneNumber } = await req.json();

    // Validate inputs
    if (!email || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate email OTP only
    const emailOTP = generateOTP();
    const tempId = crypto.randomUUID();

    // Create OTP verification record
    await prisma.oTPVerification.create({
      data: {
        email,
        phoneNumber,
        emailOTP,
        phoneOTP: "", // We'll handle phone OTP separately with Aadhaar
        tempId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        emailVerified: false,
        phoneVerified: false,
      },
    });

    // Send email verification
    await sendVerificationEmail(email, emailOTP);

    return NextResponse.json({
      success: true,
      tempId,
      message: "Email verification code sent",
    });
  } catch (error) {
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
