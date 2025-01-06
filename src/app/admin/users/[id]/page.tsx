'use client'

import { useEffect, useState, use } from 'react'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2 } from "lucide-react";

// Replace icon components with SVG elements
const ArrowLeftIcon = () => (
    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
)

const CheckCircleIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const XCircleIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
                    <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Active User
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Personal Information */}
                    <div className="lg:col-span-1">
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
                                    value={user.createdAt ? format(new Date(user.createdAt), 'PPP') : 'N/A'}
                                    icon="📅"
                                />
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
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">RC Lost Declaration</h3>
                                        <p className="text-gray-600 text-sm">{user.rcLostDeclaration}</p>
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

    return (
        <div className={`rounded-lg border ${getTypeStyles()} p-4 hover:shadow-md transition-all duration-200`}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs uppercase">{type}</span>
            </div>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm hover:opacity-75 transition-opacity"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                <span>View Document</span>
            </a>
        </div>
    )
}

function StatusCard({ title, status, label }: StatusCardProps) {
    return (
        <div className={`p-4 rounded-lg ${status ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
            }`}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
            <div className="flex items-center space-x-2">
                {status ? <CheckCircleIcon /> : <XCircleIcon />}
                <span className={`text-sm ${status ? 'text-green-700' : 'text-gray-600'
                    }`}>{label}</span>
            </div>
        </div>
    )
} 