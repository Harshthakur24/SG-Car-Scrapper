import { NextResponse } from "next/server";
import axios, { AxiosRequestConfig } from "axios";

export async function POST(request: Request) {
  try {
    // Parse the request body to extract the Aadhaar number, consent, and reason
    const {
      aadharNumber,
      consent = "y",
      reason = "For KYC",
    } = await request.json();

    if (!aadharNumber) {
      return NextResponse.json(
        { success: false, error: "Aadhaar number is required" },
        { status: 400 }
      );
    }

    // Remove spaces from the Aadhaar number (if any)
    const sanitizedAadharNumber = aadharNumber.replace(/\s/g, "");

    const optionstoken: AxiosRequestConfig = {
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

    // Set up the Axios request options
    const options: AxiosRequestConfig = {
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
        consent,
        reason,
      },
    };

    // Send the OTP request to the Aadhaar sandbox endpoint
    const response = await axios.request(options);

    // Return the response from the sandbox API
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully!",
      data: response.data,
    });
    //eslint-disable-next-line
  } catch (error: any) {
    // Log detailed error info from the response, if available
    console.error("Error sending OTP:", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
