/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const { email, otp, tempId, aadharNumber } = await request.json();
    if (!email || !otp || !tempId || !aadharNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
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
        { success: false, error: "Invalid or expired email verification code" },
        { status: 400 }
      );
    }
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { emailVerified: true },
    });
    const sanitizedAadharNumber = aadharNumber.replace(/\s/g, "");
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
    console.log("Sandbox API Token received:", token);
    const aadhaarOtpOptions = {
      method: "POST",
      url: "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp",
      headers: {
        accept: "application/json",
        authorization: token,
        "x-api-key": process.env.SANDBOX_API_KEY,
        "x-api-version": "2.0",
        "content-type": "application/json",
      },
      data: {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: sanitizedAadharNumber,
        consent: "y",
        reason: "For KYC",
      },
    };
    let phoneOtpResponse;
    try {
      console.log("Attempting to send phone OTP with options:", {
        url: aadhaarOtpOptions.url,
        aadhaar: sanitizedAadharNumber.slice(-4),
      });
      phoneOtpResponse = await axios.request(aadhaarOtpOptions);
      console.log("Sandbox API Response received:", {
        status: phoneOtpResponse.status,
        data: phoneOtpResponse.data,
      });
      const phoneOTPReference = String(
        phoneOtpResponse.data?.data?.reference_id
      );
      if (!phoneOTPReference) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to retrieve OTP reference from API response",
            responseData: phoneOtpResponse.data,
          },
          { status: 500 }
        );
      }
      console.log(
        "Updating database with phone OTP reference:",
        phoneOTPReference
      );
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { phoneOTP: phoneOTPReference },
      });
      console.log("Database updated successfully");
      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully. Phone OTP has been sent.",
          reference: phoneOTPReference,
        },
        { status: 200 }
      );
    } catch (error: any) {
      // console.error("Failed to send phone OTP:", {
      //   message: error.message,
      //   response: error.response?.data,
      //   status: error.response?.status,
      //   stack: error.stack,
      // });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send phone OTP",
          details: error.response?.data?.message || error.message,
          errorCode: error.response?.status || 500,
        },
        { status: error.response?.status || 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
