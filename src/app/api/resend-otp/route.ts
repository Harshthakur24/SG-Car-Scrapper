import { NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/email';
import { sendVerificationSMS } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { email, phoneNumber, tempId, method } = await request.json();

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    global.otpStore.set(tempId, { 
      otp, 
      email,
      phoneNumber: formattedPhone, 
      expires 
    });

    if (method === 'email') {
      await sendVerificationEmail(email, otp);
    } else {
      await sendVerificationSMS(formattedPhone);
    }

    return NextResponse.json(
      { message: 'OTP resent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
} 