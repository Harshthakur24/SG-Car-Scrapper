'use client'

import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function OTPVerification() {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Only send OTP if it hasn't been sent yet
        if (!otpSent) {
            const loadingToast = toast.loading('Sending OTP to admin...')
            handleSendOTP()
                .then(() => {
                    toast.dismiss(loadingToast)
                    toast.success('OTP sent to admin!', {
                        duration: 4000,
                        icon: '📧'
                    })
                    setOtpSent(true)
                })
                .catch((error) => {
                    toast.dismiss(loadingToast)
                    toast.error(error.message || 'Failed to send OTP')
                })
        }
    }, [otpSent])

    const handleSendOTP = async () => {
        setLoading(true)
        const adminEmail = "thakur2004harsh@gmail.com"

        try {
            const response = await fetch('/api/admin/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: adminEmail
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP')
            }
            return true

        } catch (error) {
            console.error('Send OTP error:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/admin/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
                    otp
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                if (data.error?.toLowerCase().includes('invalid otp')) {
                    throw new Error('Invalid OTP. Please try again.')
                }
                throw new Error(data.error)
            }

            await fetch('/api/admin/set-auth-cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: data.token }),
            })

            toast.success('Welcome admin!', { duration: 1500 })
            setTimeout(() => {
                router.push('/admin')
            }, 1500)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
            <Toaster position="top-center" />
            <div className="max-w-md w-full space-y-6 p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
                <div className="space-y-3">
                    <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">Admin Verification</h2>
                    <p className="text-center text-gray-600 text-sm sm:text-base">
                        Enter the OTP sent to your email
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-lg tracking-wider text-center transition-all duration-200"
                            maxLength={6}
                        />
                        <p className="text-xs text-gray-500 text-center">
                            {6 - otp.length} digits remaining
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base font-medium"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Verifying...
                            </span>
                        ) : 'Verify OTP'}
                    </button>
                </form>

                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resend OTP
                    </button>
                </div>
            </div>
        </div>
    )
}