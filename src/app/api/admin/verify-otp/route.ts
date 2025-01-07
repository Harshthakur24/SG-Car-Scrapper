import { NextResponse } from 'next/server'
import OTPManager from '@/lib/otpState'

export async function POST(request: Request) {
    try {
        const { otp } = await request.json()
        console.log('Verifying OTP:', { receivedOTP: otp, storedOTP: OTPManager.getOTP() })

        if (!OTPManager.getOTP()) {
            console.log('OTP expired or not found')
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
        }

        if (otp !== OTPManager.getOTP()) {
            console.log('OTP mismatch')
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
        }

        console.log('OTP verified successfully')
        OTPManager.clearOTP()
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
    }
} 