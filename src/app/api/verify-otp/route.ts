import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const { email, phoneNumber, otp, tempId, method, formData } = await request.json();

    // 1. Verify OTP
    if (method === 'email') {
      const otpData = global.otpStore?.get(tempId);
      if (!otpData || otpData.otp !== otp || otpData.email !== email || otpData.expires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
      }
    } else {
      const isValid = await verifyOTP(phoneNumber, otp);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }
    }

    try {
      // 2. Upload files
      const [adharUrl, panUrl, rcUrl, checkUrl, challanUrl, deathCertificateUrl, hypothecationDocUrl] = 
        await Promise.all([
          uploadToCloudinary(formData.files.adharCard),
          uploadToCloudinary(formData.files.panCard),
          uploadToCloudinary(formData.files.registrationCertificate),
          uploadToCloudinary(formData.files.cancelledCheck),
          uploadToCloudinary(formData.files.challanSeizureMemo),
          formData.files.deathCertificate ? uploadToCloudinary(formData.files.deathCertificate) : null,
          formData.files.hypothecationClearanceDoc ? uploadToCloudinary(formData.files.hypothecationClearanceDoc) : null,
        ]);

      // 3. Create user
      await prisma.user.create({
        data: {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          adharCard: adharUrl || '',
          panCard: panUrl || '',
          registrationCertificate: rcUrl || '',
          deathCertificate: deathCertificateUrl,
          cancelledCheck: checkUrl || '',
          challanSeizureMemo: challanUrl || '',
          hypothecationClearanceDoc: hypothecationDocUrl,
          isHypothecated: Boolean(formData.isHypothecated),
          isRcLost: Boolean(formData.isRcLost),
          rcLostDeclaration: formData.rcLostDeclaration || '',
          vahanRegistrationLink: formData.vahanRegistrationLink,
          isVerified: true,
        },
      });

      // 4. Cleanup and respond
      global.otpStore?.delete(tempId);
      return NextResponse.json({ success: true });

    } catch (dbError) {
      console.error('Database/Upload Error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to save submission' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ 
      error: 'Verification failed' 
    }, { status: 500 });
  }
} 