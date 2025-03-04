import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() { 
  try { 
    const users = await prisma.user.findMany({ 
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phoneNumber: true, 
        vehicleNumber: true, 
        paymentDone: true, 
        createdAt: true 
      },
      orderBy: {
        createdAt: 'desc' 
      }
    }); 

    console.log('Fetched users:', users); 
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'no-store, max-age=0' 
      }
    }); 
  } catch (error) { 
    console.error('Error fetching users:', error); 
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 }); 
  } 
}