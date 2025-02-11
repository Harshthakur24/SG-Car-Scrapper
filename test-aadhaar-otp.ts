import axios, { AxiosRequestConfig } from "axios";
import { NextResponse } from "next/server";

async function sendAadhaarOtp(): Promise<void> {
  const options: AxiosRequestConfig = {
    method: "POST",
    url: "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp",
    headers: {
      accept: "application/json",
      authorization:
        "eyJhbGciOiJIUzUxMiJ9.eyJhdWQiOiJBUEkiLCJyZWZyZXNoX3Rva2VuIjoiZXlKaGJHY2lPaUpJVXpVeE1pSjkuZXlKaGdrdWMyRnVaR0p2ZUM1amJ5NXBiaUlzSW1WNGNDSTZNVGMzTURVMk1qVTNNaXdpYVc1MFpXNTBJam9pVWtWR1VrVlRTRjlVVDB0RlRpSXNJbWxoZENJNk1UY3pPVEF5TmpVM01uMC42SXZDd040MEYzeGhfVVRyZzVYZV9PRERKYkFhV0p5TnJ4WWI3SzVoTXdtWlZHYm9IZERyYnlwUGlNWHZxc2pvTzAtdjRYNEpWdkppOWNFM2UxRGw1dy",
      "x-api-key": "key_live6yDYQqdXSlf2JxiSsFWv6OheAMPxO3oP",
      "x-api-version": "2.0",
      "content-type": "application/json",
    },
    data: {
      "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
      aadhaar_number: "496720286015",
      consent: "y",
      reason: "For KYC",
    },
  };

  try {
    const response = await axios.request(options);
    console.log("Response data:", response.data);
  } catch (error: any) {
    console.error(
      "Error sending OTP:",
      error.response ? error.response.data : error.message
    );

    NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

sendAadhaarOtp();
