import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is the exact type signature Next.js expects
export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: params.id
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching user' },
            { status: 500 }
        );
    }
}
