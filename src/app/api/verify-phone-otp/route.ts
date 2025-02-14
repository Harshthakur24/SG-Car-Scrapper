import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { uploadToCloudinary } from "../../../lib/cloudinary";
import axios from "axios";

export async function POST(request: Request) {
  const startTime = new Date();
  console.log(
    `[DEBUG] ${startTime.toISOString()}: Received verify-phone-otp request`
  );
  try {
    const payload = await request.json();
    console.log(`[DEBUG] Request payload: ${JSON.stringify(payload)}`);
    const { email, otp, tempId, formData } = payload;
    if (!email || !otp || !tempId || !formData) {
      console.error(
        `[ERROR] Missing required fields: email, otp, tempId or formData.`
      );
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    console.log(
      `[DEBUG] Request contains email: ${email}, otp: ${otp}, tempId: ${tempId}`
    );
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
      console.error(
        `[ERROR] No OTP record found or record expired for email: ${email}, tempId: ${tempId}`
      );
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification data" },
        { status: 400 }
      );
    }
    console.log(
      `[DEBUG] Retrieved OTP record: ${JSON.stringify({
        id: otpRecord.id,
        phoneOTP: otpRecord.phoneOTP,
        expiresAt: otpRecord.expiresAt,
      })}`
    );
    const optionstoken = {
      method: 'POST',
      url: 'https://api.sandbox.co.in/authenticate',
      headers: {
        accept: 'application/json',
        'x-api-key': process.env.SANDBOX_API_KEY,
        'x-api-secret': process.env.SANDBOX_API_SECRET,
        'x-api-version': '2.0'
      }
    };
    
    const token = (await axios.request(optionstoken)).data.access_token;
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
    console.log(
      `[DEBUG] Aadhaar verify options: ${JSON.stringify(
        {
          url: aadhaarVerifyOptions.url,
          headers: {
            accept: aadhaarVerifyOptions.headers.accept,
            authorization: "***",
            "x-api-key": "***",
            "x-api-version": aadhaarVerifyOptions.headers["x-api-version"],
            "content-type": aadhaarVerifyOptions.headers["content-type"],
          },
          data: aadhaarVerifyOptions.data,
        },
        null,
        2
      )}`
    );
    console.log(
      `[DEBUG] Attempting to verify OTP at ${aadhaarVerifyOptions.url}...`
    );
    const verifyResponse = await axios.request(aadhaarVerifyOptions);
    console.log(`[DEBUG] Received response. Status: ${verifyResponse.status}`);
    console.log(
      `[DEBUG] Response headers: ${JSON.stringify(verifyResponse.headers)}`
    );
    console.log(
      `[DEBUG] Response data: ${JSON.stringify(verifyResponse.data)}`
    );
    if (verifyResponse.status !== 200) {
      console.error(
        `[ERROR] OTP verification failed with non-200 status: ${verifyResponse.status}`
      );
      throw new Error("OTP verification failed");
    }
    const updateResult = await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { phoneVerified: true },
    });
    console.log(
      `[DEBUG] Updated OTP record to phoneVerified: true (record id: ${updateResult.id})`
    );
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
    const endTime = new Date();
    console.log(
      `[DEBUG] Process completed in ${
        endTime.getTime() - startTime.getTime()
      } ms`
    );
    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Phone verified and application submitted successfully",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[ERROR] Exception in verify-phone-otp: `, error);
    if (error.response) {
      console.error(
        `[ERROR] Axios error response status: ${error.response.status}`
      );
      console.error(
        `[ERROR] Axios error response headers: ${JSON.stringify(
          error.response.headers
        )}`
      );
      console.error(
        `[ERROR] Axios error response data: ${JSON.stringify(
          error.response.data
        )}`
      );
    } else {
      console.error(`[ERROR] ${error.message}`);
    }
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
