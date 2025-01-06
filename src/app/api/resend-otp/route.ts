import { NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/email';
import { sendVerificationSMS } from '@/lib/twilio';

export async function POST(request: Request) {
    try {
        const { email, phoneNumber, tempId, method } = await request.json();

        if (!email || !phoneNumber || !tempId || !method) {
            return NextResponse.json({ 
                success: false,
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        const otp = generateOTP();

        // Update OTP in store
        global.otpStore = global.otpStore || new Map();
        global.otpStore.set(tempId, {
            otp,
            email,
            phoneNumber,
            expires: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 0,
            verified: false
        });

        if (method === 'phone') {
            try {
                await sendVerificationSMS(phoneNumber);
                return NextResponse.json({ 
                    success: true,
                    message: 'SMS verification code sent' 
                });
            } catch (error) {
                // Automatically send email OTP as fallback
                await sendVerificationEmail(email, otp);
                return NextResponse.json({ 
                    success: true,
                    message: 'SMS service unavailable. Verification code sent to email instead.',
                    fallbackToEmail: true
                });
            }
        } else {
            await sendVerificationEmail(email, otp);
            return NextResponse.json({ 
                success: true,
                message: 'Email verification code sent' 
            });
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to send verification code' 
        }, { status: 500 });
    }
} 