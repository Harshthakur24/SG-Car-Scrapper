import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const vahanRegistrationLink = formData.get('vahanRegistrationLink') as string;
    
    // Get file data
    const adharCard = formData.get('adharCard') as File;
    const panCard = formData.get('panCard') as File;
    const registrationCertificate = formData.get('registrationCertificate') as File;
    const deathCertificate = formData.get('deathCertificate') as File | null;
    const cancelledCheck = formData.get('cancelledCheck') as File;
    const challanSeizureMemo = formData.get('challanSeizureMemo') as File;
    const hypothecationClearanceDoc = formData.get('hypothecationClearanceDoc') as File | null;
    
    // Get additional fields
    const isRcLost = formData.get('isRcLost') === 'true';
    const isHypothecated = formData.get('isHypothecated') === 'true';
    const rcLostDeclaration = formData.get('rcLostDeclaration') as string | null;

    // Validate required fields (excluding optional fields)
    if (!name || !email || !phoneNumber || !vahanRegistrationLink || 
        !adharCard || !panCard || !registrationCertificate || 
        !cancelledCheck || !challanSeizureMemo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate conditional fields
    if (isHypothecated && !hypothecationClearanceDoc) {
      return NextResponse.json(
        { error: 'Hypothecation clearance document is required when hypothecation is cleared' },
        { status: 400 }
      );
    }

    if (isRcLost && !rcLostDeclaration) {
      return NextResponse.json(
        { error: 'Please fill the RC lost declaration section' },
        { status: 400 }
      );
    }

    // Upload required files
    const [adharUrl, panUrl, rcUrl, checkUrl, challanUrl] = await Promise.all([
      uploadToCloudinary(adharCard),
      uploadToCloudinary(panCard),
      uploadToCloudinary(registrationCertificate),
      uploadToCloudinary(cancelledCheck),
      uploadToCloudinary(challanSeizureMemo),
    ]);

    // Handle deathCertificate separately since it's optional
    let deathCertificateUrl = null;
    if (deathCertificate) {
      deathCertificateUrl = await uploadToCloudinary(deathCertificate);
    }

    let hypothecationDocUrl = null;
    if (isHypothecated && hypothecationClearanceDoc) {
      hypothecationDocUrl = await uploadToCloudinary(hypothecationClearanceDoc);
    }

    // Save to database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        adharCard: adharUrl,
        panCard: panUrl,
        registrationCertificate: rcUrl,
        deathCertificate: deathCertificateUrl,
        cancelledCheck: checkUrl,
        challanSeizureMemo: challanUrl,
        isHypothecated,
        hypothecationClearanceDoc: hypothecationDocUrl,
        isRcLost,
        rcLostDeclaration,
        vahanRegistrationLink,
      },
    });

    return NextResponse.json(
      { 
        message: 'Documents submitted successfully',
        user
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 