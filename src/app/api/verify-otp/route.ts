import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json();
        
        if (!body) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid request body' 
            }, { status: 400 });
        }

        const { email, phoneNumber, otp, tempId, method, formData } = body;

        // Verify OTP from store
        const otpData = global.otpStore?.get(tempId);
        if (!otpData || otpData.email !== email) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid verification code' 
            }, { status: 400 });
        }

        // Verify OTP before proceeding
        if (method === 'phone') {
            console.log('Starting phone verification process:', {
                phoneNumber,
                otp,
                tempId,
                otpDataExists: !!otpData
            });

            if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
                console.error('Missing TWILIO_VERIFY_SERVICE_SID environment variable');
                return NextResponse.json({ 
                    success: false,
                    error: 'Server configuration error' 
                }, { status: 500 });
            }
            
            const isValid = await verifyOTP(phoneNumber, otp);
            console.log('Phone verification result:', { isValid });

            if (!isValid) {
                return NextResponse.json({ 
                    success: false,
                    error: 'Invalid verification code' 
                }, { status: 400 });
            }
        } else {
            console.log('Starting email verification process:', {
                email,
                providedOtp: otp,
                storedOtp: otpData?.otp,
                tempId,
                otpDataExists: !!otpData
            });

            if (otpData.otp !== otp) {
                return NextResponse.json({ 
                    success: false,
                    error: 'Invalid verification code' 
                }, { status: 400 });
            }
        }

        // Clean up OTP after successful verification
        global.otpStore?.delete(tempId);

        // Log received data
        console.log('Received form data:', formData);

        // Upload files
        const uploadResults = await Promise.all(
            Object.entries(formData.files || {}).map(async ([key, value]) => {
                if (!value) return null;
                try {
                    console.log(`Uploading ${key}...`);
                    const url = await uploadToCloudinary(value as string);
                    console.log(`Successfully uploaded ${key}: ${url}`);
                    return url;
                } catch (error) {
                    console.error(`Failed to upload ${key}:`, error);
                    return null;
                }
            })
        );

       

        // Create user
        const user = await prisma.user.create({
            data: {
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                vehicleNumber: formData.vehicleNumber?.toString().toUpperCase() || '',
                aadharNumber: formData.aadharNumber?.replace(/\D/g, '') || '',
                adharCard: uploadResults[0] || '',
                panCard: uploadResults[1] || '',
                registrationCertificate: uploadResults[2] || '',
                cancelledCheck: uploadResults[3] || '',
                challanSeizureMemo: uploadResults[4] || '',
                deathCertificate: uploadResults[5] || null,
                hypothecationClearanceDoc: uploadResults[6] || null,
                isHypothecated: Boolean(formData.isHypothecated),
                isRcLost: Boolean(formData.isRcLost),
                rcLostDeclaration: formData.rcLostDeclaration || '',
                vahanRegistrationLink: formData.vahanRegistrationLink || '',
                isVerified: true,
                paymentDone: false
            },
        });

        console.log('Created user:', user);

        return NextResponse.json({ 
            success: true,
            userId: user.id,
            message: 'Verification successful'
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to process request' 
        }, { status: 500 });
    }
} 