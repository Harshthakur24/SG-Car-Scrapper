import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import OTPManager from '@/lib/otpState'

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        console.log('Generated OTP:', otp)
        OTPManager.setOTP(otp) 

        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Admin Panel Authentication OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Admin Panel Authentication</h2>
                    <p>Your OTP for accessing the admin panel is:</p>
                    <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error sending OTP:', error)
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        )
    }
} 