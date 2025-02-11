import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const { email, otp, tempId, formData } = await request.json();

    if (!email || !otp || !tempId || !formData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify OTP from database
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email,
        tempId,
        emailOTP: otp,
        expiresAt: { gt: new Date() },
        emailVerified: false,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Process and upload files
    const uploadResults = await Promise.all(
      Object.entries(formData.files || {}).map(async ([key, value]) => {
        if (!value) return null;
        try {
          if (typeof value === "string" && value.includes("base64")) {
            return await uploadToCloudinary(value);
          }
          return null;
        } catch (error) {
          console.error(`Failed to upload ${key}:`, error);
          return null;
        }
      })
    );

    // Create user with uploaded files
    const user = await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        vehicleNumber: formData.vehicleNumber?.toString().toUpperCase() || "",
        aadharNumber: formData.aadharNumber?.replace(/\D/g, "") || "",
        adharCard: uploadResults[0] || "",
        panCard: uploadResults[1] || "",
        registrationCertificate: uploadResults[2] || "",
        cancelledCheck: uploadResults[3] || "",
        challanSeizureMemo: uploadResults[4] || "",
        deathCertificate: uploadResults[5] || null,
        hypothecationClearanceDoc: uploadResults[6] || null,
        isHypothecated: Boolean(uploadResults[6]),
        isRcLost: Boolean(formData.isRcLost),
        rcLostDeclaration: formData.rcLostDeclaration || "",
        vahanRegistrationLink: formData.vahanRegistrationLink || "",
        isVerified: true,
        paymentDone: false,
      },
    });

    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: {
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Verification successful",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
