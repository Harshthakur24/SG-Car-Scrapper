import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(users);
    } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
} 