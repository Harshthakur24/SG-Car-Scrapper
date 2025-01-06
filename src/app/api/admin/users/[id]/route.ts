import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } }

export async function GET(
    request: NextRequest,
    { params }: Params
) {
    if (!params.id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: String(params.id)
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
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 