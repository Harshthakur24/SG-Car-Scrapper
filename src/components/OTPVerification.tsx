'use client'

import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'

export default function OTPVerification() {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Check if already authenticated
        const isAuth = sessionStorage.getItem('adminAuthenticated')
        if (isAuth === 'true') {

        }

        // Check if OTP was already sent
        const otpSent = sessionStorage.getItem('otpSent')
        if (!otpSent) {
            handleSendOTP()
            sessionStorage.setItem('otpSent', 'true')
        }
    }, []) // Remove router from dependencies

    const handleSendOTP = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''
                }),
            })

            if (!response.ok) throw new Error('Failed to send OTP')
            toast.success('OTP sent to admin email!')
        } catch (error) {
            toast.error('Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        setLoading(true)
        const loadingToast = toast.loading('Verifying...')

        try {
            const response = await fetch('/api/admin/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed')
            }

            toast.dismiss(loadingToast)
            toast.success('Verification successful, Welcome Admin!')
            sessionStorage.setItem('adminAuthenticated', 'true')
            setTimeout(() => {
                window.location.reload()
            }, 1300)

        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error(error instanceof Error ? error.message : 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
            <Toaster position="top-center" />
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Admin Authentication</h2>
                    <p className="text-gray-600 mt-2">Please verify your identity to access the admin panel</p>
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 text-sm">
                            An OTP has been sent to <strong>Admin&apos;s Email</strong>
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            id="otp"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter 6-digit OTP"
                        />
                    </div>
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Resend OTP'}
                    </button>
                </div>
            </div>
        </div>
    )
} 