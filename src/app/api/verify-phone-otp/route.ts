import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { uploadToCloudinary } from "../../../lib/cloudinary";
import axios from "axios";

async function retryRequest<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      console.error(`[ERROR] Attempt ${attempt} failed:`, error);
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay)); // Delay before retrying
    }
  }
  throw new Error("Failed after multiple retries");
}

export async function POST(request: Request) {
  const startTime = new Date();
  console.log(`[DEBUG] ${startTime.toISOString()}: Received verify-phone-otp request`);

  try {
    const payload = await request.json();
    console.log(`[DEBUG] Request payload: ${JSON.stringify(payload)}`);

    const { email, otp, tempId, formData, token } = payload;
    if (!email || !otp || !tempId || !formData || !token) {
      console.error(`[ERROR] Missing required fields: email, otp, tempId, formData or token.`);
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        email,
        tempId,
        expiresAt: { gt: new Date() },
        emailVerified: true,
        phoneVerified: false,
      },
    });

    if (!otpRecord) {
      console.error(`[ERROR] No OTP record found or record expired for email: ${email}, tempId: ${tempId}`);
      return NextResponse.json({ success: false, error: "Invalid or expired verification data" }, { status: 400 });
    }

    const aadhaarVerifyOptions = {
      method: "POST",
      url: "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify",
      headers: {
        accept: "application/json",
        authorization: token,
        "x-api-key": process.env.SANDBOX_API_KEY,
        "x-api-version": "2.0",
        "content-type": "application/json",
      },
      data: {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: String(otpRecord.phoneOTP),
        otp: String(otp),
      },
    };

    console.log(`[DEBUG] Attempting OTP verification...`);

    const verifyResponse = await retryRequest(() => axios.request(aadhaarVerifyOptions), 3, 2000);
    console.log(`[DEBUG] OTP verification successful. Status: ${verifyResponse.status}`);

    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { phoneVerified: true },
    });

    console.log(`[DEBUG] OTP record updated: phoneVerified = true`);

    const uploadResults = await Promise.all(
      Object.entries(formData.files || {}).map(async ([key, value]) => {
        if (!value) return null;
        try {
          if (typeof value === "string" && value.includes("base64")) {
            return await retryRequest(() => uploadToCloudinary(value), 3, 2000);
          }
          return null;
        } catch (error) {
          console.error(`Failed to upload ${key}:`, error);
          return null;
        }
      })
    );

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

    console.log(`[DEBUG] User created with ID: ${user.id}`);

    const endTime = new Date();
    console.log(`[DEBUG] Process completed in ${endTime.getTime() - startTime.getTime()} ms`);

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Phone verified and application submitted successfully",
    });

  } catch (error: any) {
    console.error(`[ERROR] Exception in verify-phone-otp:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify phone OTP",
        details: error.response ? error.response.data : error.message,
      },
      { status: 500 }
    );
  }
}
