import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is the correct type signature for Next.js 15 dynamic route handlers
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    if (!params?.id) {
        return NextResponse.json(
            { error: 'Invalid user ID' },
            { status: 400 }
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: params.id
            },
            select: {
                id: true,
                email: true,
                name: true,
                // Add other fields you want to return
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: user });

    } catch (error) {
        console.error('[GET_USER_BY_ID]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 