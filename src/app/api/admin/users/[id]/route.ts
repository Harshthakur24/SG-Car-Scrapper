import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        aadharNumber: true,
        vehicleNumber: true,
        createdAt: true,
        paymentDone: true,
        isRcLost: true,
        isHypothecated: true,
        rcLostDeclaration: true,
        adharCard: true,
        panCard: true,
        registrationCertificate: true,
        cancelledCheck: true,
        challanSeizureMemo: true,
        deathCertificate: true,
        hypothecationClearanceDoc: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform document URLs to full URLs if needed
    const transformedUser = {
      ...user,
      adharCard: getFullUrl(user.adharCard),
      panCard: getFullUrl(user.panCard),
      registrationCertificate: getFullUrl(user.registrationCertificate),
      cancelledCheck: getFullUrl(user.cancelledCheck),
      challanSeizureMemo: getFullUrl(user.challanSeizureMemo),
      deathCertificate: user.deathCertificate ? getFullUrl(user.deathCertificate) : null,
      hypothecationClearanceDoc: user.hypothecationClearanceDoc ? getFullUrl(user.hypothecationClearanceDoc) : null,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

function getFullUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.includes('res.cloudinary.com')) return `https://${url}`;
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${url}`;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const user = await prisma.user.update({
      where: { id },
      data: { 
        paymentDone: Boolean(data.paymentDone),
        paymentTiming: data.paymentDone ? new Date() : null,
        paymentOwner: data.paymentOwner || null,
        paymentDetails: data.paymentDetails || null
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    );
  }
}

// Ensure route is dynamic
export const dynamic = 'force-dynamic';