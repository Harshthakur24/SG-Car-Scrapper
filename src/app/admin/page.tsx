'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@prisma/client'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Skeleton } from "../../components/ui/skeleton"
import OTPVerification from '../../components/OTPVerification'


const SearchIcon = () => (
    <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="presentation"
        aria-label="Search"
    >
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
            <Skeleton className="h-5 w-24" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <Skeleton className="h-5 w-24 ml-auto" />
        </td>
    </tr>
)

// Update type definition to use User type directly
type SortableFields = keyof User;

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<SortableFields>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const router = useRouter()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
        user.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleFilterClick = (field: SortableFields, order: 'asc' | 'desc') => {
        setSortField(field)
        setSortOrder(order)
        setIsFilterOpen(false)
    }

    useEffect(() => {
        const authStatus = sessionStorage.getItem('adminAuthenticated')
        setIsAuthenticated(authStatus === 'true')
    }, [])

    if (!isAuthenticated) {
        return <OTPVerification />
    }

    return (

        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    {/* Header */}
                    <div className="px-3 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 py-4">
                            {/* Title and Loading State */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 w-full sm:w-auto">
                                User Submissions
                                {loading && (
                                    <div className="inline-flex items-center ml-3">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                        <span className="ml-2 text-sm text-gray-500 font-normal">Refreshing...</span>
                                    </div>
                                )}
                            </h1>

                            {/* Search and Controls Container */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                {/* Search Input */}
                                <div className="relative w-full sm:w-64 md:w-80">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search vehicle number..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border text-black border-gray-300 
                                            rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                            bg-white shadow-sm"
                                    />
                                    <SearchIcon />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    {/* Refresh Button */}
                                    <button
                                        onClick={() => {
                                            setLoading(true)
                                            fetchUsers()
                                        }}
                                        disabled={loading}
                                        className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 
                                            transition-all duration-200 bg-white shadow-sm
                                            ${loading ? 'animate-spin' : ''}`}
                                    >
                                        <RefreshIcon />
                                    </button>

                                    {/* Filter Button */}
                                    <div className="relative" ref={filterRef}>
                                        <button
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 
                                                transition-all duration-200 bg-white shadow-sm
                                                ${isFilterOpen ? 'bg-gray-50' : ''}`}
                                        >
                                            <FilterIcon />
                                        </button>

                                        {isFilterOpen && (
                                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                <div className="py-1" role="menu">
                                                    <button
                                                        onClick={() => handleFilterClick('createdAt', 'desc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Latest First
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterClick('createdAt', 'asc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Oldest First
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterClick('paymentDone', 'desc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Payment Done
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterClick('paymentDone', 'asc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Payment Not Done
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterClick('name', 'asc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Alphabetical (A-Z)
                                                    </button>
                                                    <button
                                                        onClick={() => handleFilterClick('name', 'desc')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Alphabetical (Z-A)
                                                    </button>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                        onClick={() => handleSort('paymentDone')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Payment
                                    </th>
                                    <th
                                        onClick={() => handleSort('createdAt')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Submitted
                                    </th>
                                    <th
                                        onClick={() => handleSort('vehicleNumber')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        Vehicle Number
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
                                                <span className={`px-3 py-1.5 inline-flex items-center text-sm leading-5 font-semibold rounded-full
                                                    ${user.paymentDone
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}>

                                                    {user.paymentDone ? 'Done' : 'Not Done'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.vehicleNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    className="inline-flex items-center px-4 py-2 rounded-lg
                                                        bg-blue-50 text-blue-700 font-medium
                                                        hover:bg-blue-100 active:bg-blue-200
                                                        border border-blue-200 hover:border-blue-300
                                                        transition-all duration-200 ease-in-out
                                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                >
                                                    <span>View Details</span>
                                                    <svg
                                                        className="ml-2 h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
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