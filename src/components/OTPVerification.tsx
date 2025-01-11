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
        try {
            const response = await fetch('/api/admin/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP')
            }
            return true

        } catch (error) {
            console.error('Send OTP error:', error)
            throw error // Re-throw to be caught by the useEffect
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
            if (!response.ok) throw new Error(data.error)

            // Set the token in a cookie
            await fetch('/api/admin/set-auth-cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: data.token }),
            })

            toast.success('Verification successful. Welcome admin!', { duration: 1500 })
            setTimeout(() => {
                router.push('/admin')
            }, 1500)
        } catch (error) {
            toast.error('Verification failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Toaster position="top-center" />
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-center text-3xl font-bold text-gray-900">Admin Verification</h2>
                <form onSubmit={handleVerify} className="mt-8 space-y-6">
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={6}
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
                <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full py-2 text-blue-600 hover:text-blue-800"
                >
                    Resend OTP
                </button>
            </div>
        </div>
    )
}