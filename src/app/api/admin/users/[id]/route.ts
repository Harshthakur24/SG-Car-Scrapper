import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// @ts-expect-error - Next.js dynamic route params typing not recognized by TypeScript
export async function GET(req, { params }) {
    const user = await prisma.user.findUnique({
        where: { id: params.id }
    });

    if (!user) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(user);
}
