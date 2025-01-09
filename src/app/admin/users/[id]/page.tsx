'use client'

import { useEffect, useState, use } from 'react'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { UserDocumentsPDF } from '@/components/UserDocumentsPDF'


const ArrowLeftIcon = () => (
    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
)

interface ConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { paymentOwner: string; paymentDetails: string }) => void
    isPaymentDone: boolean
    userName: string
}

function ConfirmationDialog({ isOpen, onClose, onConfirm, isPaymentDone, userName }: ConfirmationDialogProps) {
    const [paymentOwner, setPaymentOwner] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');

    const handleSubmit = () => {
        onConfirm({ paymentOwner, paymentDetails });
        setPaymentOwner('');
        setPaymentDetails('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                Confirm Payment Status Update for {userName}
                            </h3>
                            <div className="mt-4 space-y-4">
                                {!isPaymentDone && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Payment Owner
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentOwner}
                                                onChange={(e) => setPaymentOwner(e.target.value)}
                                                className="mt-1 text-black block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter payment owner name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Payment Details (of receiver)
                                            </label>
                                            <textarea
                                                value={paymentDetails}
                                                onChange={(e) => setPaymentDetails(e.target.value)}
                                                rows={3}
                                                className="mt-1 text-black block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter payment details"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!isPaymentDone && (!paymentOwner || !paymentDetails)}
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto
                                ${isPaymentDone
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-green-500 hover:bg-green-600'} 
                                transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isPaymentDone ? 'Unmark Payment' : 'Mark as Paid'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`/api/admin/users/${id}`)
                const data = await response.json()
                setUser(data)
            } catch (error) {
                console.error('Error fetching user:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [id])

    const handlePaymentToggle = async () => {
        setIsConfirmationOpen(true)
    }

    const handleConfirmPaymentToggle = async (paymentData: { paymentOwner?: string, paymentDetails?: string }) => {
        setIsConfirmationOpen(false);
        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentDone: !user?.paymentDone,
                    paymentOwner: paymentData.paymentOwner,
                    paymentDetails: paymentData.paymentDetails
                }),
            });

            if (!response.ok) throw new Error('Failed to update payment status');

            const data = await response.json();
            setUser(prev => prev ? { ...prev, ...data.data } : null);

            toast.success(
                `Payment ${!user?.paymentDone ? 'marked' : 'unmarked'} as done`,
                {
                    icon: !user?.paymentDone ? '✅' : '❌',
                    duration: 5000,
                }
            );
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Failed to update payment status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#004a7c]" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Go back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <Toaster position="top-center" />
            <ConfirmationDialog
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={handleConfirmPaymentToggle}
                isPaymentDone={user?.paymentDone || false}
                userName={user?.name || ''}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md"
                    >
                        <ArrowLeftIcon />
                        Back to submissions
                    </button>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handlePaymentToggle}
                            disabled={updating}
                            className={`
                                relative overflow-hidden px-6 py-3 rounded-lg font-semibold text-white shadow-lg
                                transition-all duration-300 transform hover:scale-110 hover:shadow-xl
                                flex items-center justify-center min-w-[200px] group
                                ${user?.paymentDone
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : 'bg-gradient-to-r from-green-500 to-green-600'
                                }
                                ${updating ? 'opacity-75 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:scale-105 transition-transform duration-300"></span>
                            {updating ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : user?.paymentDone ? (
                                <>
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Unmark Payment Done
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Mark Payment Done
                                </>
                            )}
                        </button>
                        <span className={`px-6 py-3 rounded-full text-base font-semibold ${user?.paymentDone
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {user?.paymentDone ? 'Payment Done' : 'Payment Pending'}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Personal Information */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Info Card */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-blue-600">
                                            {user.name?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <InfoItem label="Phone Number" value={user.phoneNumber} icon="📱" />
                                <InfoItem
                                    label="Aadhar Number"
                                    value={user.aadharNumber
                                        ? user.aadharNumber.replace(/(\d{4})/g, '$1 ').trim()
                                        : 'N/A'
                                    }
                                    icon="🆔"
                                    className="font-mono tracking-wide"
                                />
                                <InfoItem
                                    label="Joined"
                                    value={user.createdAt ? format(new Date(user.createdAt), 'PPp') : 'N/A'}
                                    icon="📅"
                                />

                                {/* New Payment Information Items */}
                                {user.paymentDone && (
                                    <>
                                        <InfoItem
                                            label="Payment Owner"
                                            value={user.paymentOwner || 'N/A'}
                                            icon="👤"
                                        />
                                        <InfoItem
                                            label="Payment Details"
                                            value={user.paymentDetails || 'N/A'}
                                            icon="💳"
                                        />
                                        <InfoItem
                                            label="Payment Time"
                                            value={user.paymentTiming
                                                ? format(new Date(user.paymentTiming), 'PPp')
                                                : 'N/A'
                                            }
                                            icon="⏰"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PDF Download Card - Now as a separate card */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                            <svg
                                                className="h-6 w-6 text-red-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                                role="img"
                                                aria-label="PDF document icon"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Download All Documents
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Get all submitted documents in a single PDF file
                                    </p>
                                    <div className="flex justify-center">
                                        <UserDocumentsPDF user={user} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Documents & Additional Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Documents Section */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EnhancedDocumentPreview label="Aadhar Card" url={user.adharCard} type="identity" />
                                    <EnhancedDocumentPreview label="PAN Card" url={user.panCard} type="identity" />
                                    <EnhancedDocumentPreview label="Registration Certificate" url={user.registrationCertificate} type="certificate" />
                                    <EnhancedDocumentPreview label="Cancelled Check" url={user.cancelledCheck} type="financial" />
                                    <EnhancedDocumentPreview label="Challan Seizure Memo" url={user.challanSeizureMemo} type="legal" />
                                    {user.deathCertificate && (
                                        <EnhancedDocumentPreview label="Death Certificate" url={user.deathCertificate} type="certificate" />
                                    )}
                                    {user.hypothecationClearanceDoc && (
                                        <EnhancedDocumentPreview label="Hypothecation Clearance" url={user.hypothecationClearanceDoc} type="legal" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Information */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Status Information</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <StatusCard
                                        title="RC Status"
                                        status={user.isRcLost}
                                        label={user.isRcLost ? "RC Lost" : "RC Available"}
                                    />
                                    <StatusCard
                                        title="Hypothecation Status"
                                        status={user.isHypothecated}
                                        label={user.isHypothecated ? "Hypothecated" : "Not Hypothecated"}
                                    />
                                </div>
                                {user.isRcLost && user.rcLostDeclaration && (
                                    <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                        <h3 className="text-base font-semibold text-gray-900 mb-3">RC Lost Declaration Statement</h3>
                                        <p className="text-gray-900 text-base leading-relaxed">{user.rcLostDeclaration}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// New helper components
interface InfoItemProps {
    label: string;
    value: string | number | null;
    icon: string;
    className?: string;
}

function InfoItem({ label, value, icon, className = "" }: InfoItemProps) {
    return (
        <div className="flex items-start space-x-3">
            <span className="text-xl">{icon}</span>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-gray-900 ${className}`}>{value || 'N/A'}</p>
            </div>
        </div>
    )
}

interface DocumentPreviewProps {
    label: string;
    url: string;
    type: 'identity' | 'certificate' | 'financial' | 'legal';
}

interface StatusCardProps {
    title: string;
    status: boolean;
    label: string;
}

function EnhancedDocumentPreview({ label, url, type }: DocumentPreviewProps) {
    const getTypeStyles = () => {
        switch (type) {
            case 'identity': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'certificate': return 'bg-green-50 text-green-600 border-green-100';
            case 'financial': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            case 'legal': return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getDocumentUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.includes('res.cloudinary.com')) return `https://${url}`;
        return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${url}`;
    };

    const documentUrl = getDocumentUrl(url);

    return (
        <div className={`rounded-lg border ${getTypeStyles()} p-3 sm:p-4 hover:shadow-md transition-all duration-200`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs uppercase">{type}</span>
            </div>
            {documentUrl ? (
                <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm hover:opacity-75 transition-opacity"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        role="presentation"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                    </svg>
                    <span>View Document</span>
                </a>
            ) : (
                <span className="text-sm text-gray-500">No document available</span>
            )}
        </div>
    );
}

function StatusCard({ title, status, label }: StatusCardProps) {
    return (
        <div className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md
            ${status
                ? 'bg-red-50 border-red-200 hover:border-red-300'
                : 'bg-green-50 border-green-200 hover:border-green-300'
            }`}>
            <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
            <div className="flex items-center space-x-3">
                <span className={`flex-shrink-0 w-3 h-3 rounded-full ${status ? 'bg-red-500' : 'bg-green-500'}`}></span>
                <span className="text-gray-900 font-medium">{label}</span>
            </div>
        </div>
    );
} 