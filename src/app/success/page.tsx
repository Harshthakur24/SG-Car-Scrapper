'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export default function SuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Show success toast after 500ms
        const toastTimer = setTimeout(() => {
            toast.success('Documents submitted successfully!', {
                duration: 4500,
                style: {
                    background: '#ffffff',
                    color: '#000000',
                    padding: '16px',
                    borderRadius: '8px',
                },
            });
        }, 500);

        // Redirect to home after 5 seconds
        const redirectTimer = setTimeout(() => {
            router.push('/');
        }, 5000);

        // Clean up both timers
        return () => {
            clearTimeout(toastTimer);
            clearTimeout(redirectTimer);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Toaster position="top-center" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-8"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
                >
                    <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        role="img"
                        aria-label="Success checkmark"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Verification Successful!
                </h1>
                <p className="text-gray-600 mb-8">
                    Your documents have been submitted successfully.
                </p>
                <p className="text-sm text-gray-500">
                    Redirecting to home page in 5 seconds...
                </p>
            </motion.div>
        </div>
    );
} 