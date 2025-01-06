import { NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email, phoneNumber } = await req.json();

        // Validate inputs
        if (!email || !phoneNumber) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const tempId = crypto.randomUUID();

        // Store OTP
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(tempId, {
            otp,
            email,
            phoneNumber,
            expires: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 0,
            verified: false
        });

        // Send email verification
        await sendVerificationEmail(email, otp);

        return NextResponse.json({ 
            success: true, 
            tempId,
            message: 'Verification code sent' 
        });

    } catch (error) {
        console.error('OTP generation error:', error);
        return NextResponse.json(
            { error: 'Failed to send verification code' },
            { status: 500 }
        );
    }
} 