import { NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/email';
import { sendVerificationSMS } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { email, phoneNumber } = await request.json();
    const otp = generateOTP();
    const tempId = crypto.randomUUID();

    // Store OTP for email verification
    global.otpStore = global.otpStore || new Map();
    global.otpStore.set(tempId, {
      otp,
      email,
      phoneNumber,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email OTP
    await sendVerificationEmail(email, otp);
    // Send SMS verification
    await sendVerificationSMS(phoneNumber);

    return NextResponse.json({ 
      message: 'Verification codes sent',
      tempId 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification' },
      { status: 500 }
    );
  }
} 