import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateOTP, sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        
        if (!email) {
            return NextResponse.json({ 
                success: false, 
                error: 'Email is required' 
            }, { status: 400 })
        }

        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        try {
            // First try to send email
            await sendVerificationEmail(email, otp)
            
            // Only save OTP if email was sent successfully
            await prisma.adminOTP.create({
                data: { otp, email, expiresAt }
            })

            return NextResponse.json({ success: true })
        } catch (emailError) {
            console.error('Email sending failed:', emailError)
            return NextResponse.json({ 
                success: false, 
                error: 'Failed to send OTP email' 
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Send OTP error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Server error while sending OTP' 
        }, { status: 500 })
    }
} 