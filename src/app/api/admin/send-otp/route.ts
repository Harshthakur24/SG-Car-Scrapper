import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateOTP, sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        const otp = generateOTP()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        await prisma.adminOTP.create({
            data: { otp, email, expiresAt }
        })

        await sendVerificationEmail(email, otp)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Send OTP error:', error)
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }
} 