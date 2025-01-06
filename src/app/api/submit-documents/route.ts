import { NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const tempId = crypto.randomUUID();

    // Store OTP
    global.otpStore = global.otpStore || new Map();
    global.otpStore.set(tempId, {
      otp,
      email,
      phoneNumber: formData.get('phoneNumber') as string,
      expires: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false
    });

    // Send verification email
    await sendVerificationEmail(email, otp);

    return NextResponse.json(
      { 
        message: 'Please verify your email',
        tempId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 