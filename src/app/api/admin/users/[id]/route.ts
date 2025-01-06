import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Correct type signature for Next.js 15 dynamic route handlers
export async function GET(
    _req: NextRequest,
    context: { params: { id?: string } } // Allow optional `id` to handle edge cases gracefully
): Promise<NextResponse> {
    const { params } = context;

    // Validate the `id` parameter
    if (!params?.id) {
        return NextResponse.json(
            { error: 'Invalid user ID' },
            { status: 400 }
        );
    }

    try {
        // Fetch the user from the database
        const user = await prisma.user.findUnique({
            where: {
                id: params.id, // Use the `id` provided in the request
            },
            select: {
                id: true,
                email: true,
                name: true,
                // Include additional fields if needed
            },
        });

        // Handle case where the user is not found
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Respond with the user data
        return NextResponse.json({ data: user });
    } catch (error) {
        // Log the error for debugging purposes
        console.error('[GET_USER_BY_ID_ERROR]', error);

        // Respond with a 500 status for server errors
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
