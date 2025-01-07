import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { vehicleNumber } = await req.json();

    if (!vehicleNumber) {
      return NextResponse.json(
        { vehicleExists: false, paymentDone: false, error: 'Vehicle number is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this vehicle number
    const user = await prisma.user.findFirst({
      where: {
        vehicleNumber: vehicleNumber,
      },
    });

    return NextResponse.json({
      vehicleExists: !!user,
      paymentDone: user?.paymentDone || false,
    });

  } catch (error) {
    console.error('Error checking vehicle:', error);
    return NextResponse.json(
      { vehicleExists: false, paymentDone: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 