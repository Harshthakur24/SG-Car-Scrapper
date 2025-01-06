'use client'

import { useState, useEffect } from 'react'
import { User } from '@prisma/client'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Skeleton } from "../../components/ui/skeleton"


const SearchIcon = () => (
    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

const RefreshIcon = () => (
    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const FilterIcon = () => (
    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
)

const LoadingRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-32" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-16 rounded-full" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-24" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-28" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-24 ml-auto" />
        </td>
    </tr>
)

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<keyof User>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const router = useRouter()

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users')
            const data = await response.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to fetch users')
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
    )

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aValue = a[sortField] ?? '';
        const bValue = b[sortField] ?? '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    const handleSort = (field: keyof User) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <h1 className="text-2xl font-bold text-gray-900">
                                User Submissions
                                {loading && (
                                    <div className="inline-flex items-center ml-3">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                        <span className="ml-2 text-sm text-gray-500 font-normal">Refreshing...</span>
                                    </div>
                                )}
                            </h1>
                            <div className="flex items-center space-x-4">
                                {/* Search with enhanced styling */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    />
                                    <SearchIcon />
                                </div>
                                {/* Refresh Button with animation */}
                                <button
                                    onClick={() => {
                                        setLoading(true)
                                        fetchUsers()
                                    }}
                                    className={`p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 ${loading ? 'animate-spin' : ''
                                        }`}
                                    disabled={loading}
                                >
                                    <RefreshIcon />
                                </button>
                                {/* Filter Button with enhanced styling */}
                                <button className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                    <FilterIcon />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table with enhanced styling */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Name
                                    </th>
                                    <th
                                        onClick={() => handleSort('email')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Contact
                                    </th>
                                    <th
                                        onClick={() => handleSort('isVerified')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Status
                                    </th>
                                    <th
                                        onClick={() => handleSort('createdAt')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Submitted
                                    </th>
                                    <th
                                        onClick={() => handleSort('aadharNumber')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Aadhar Number
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    // Show multiple skeleton rows while loading
                                    Array(5).fill(0).map((_, index) => (
                                        <LoadingRow key={index} />
                                    ))
                                ) : sortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                                <p className="text-lg font-medium">No submissions found</p>
                                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-blue-50/50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                                <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isVerified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {user.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {user.aadharNumber
                                                        ? user.aadharNumber.replace(/(\d{4})/g, '$1 ').trim()
                                                        : 'N/A'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
} 